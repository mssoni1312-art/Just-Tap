const pool = require('../config/database');
const { toMysqlDate, toMysqlTime, toMysqlDateTime } = require('../helpers/mysqlFormat');

const toNumber = (value) => (value != null ? Number(value) : null);

const formatBilling = (row, functions, payments) => {
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const grandTotal = toNumber(row.grand_total) || 0;

  return {
    id: String(row.id),
    eventId: String(row.event_id),
    showToClient: Boolean(row.show_to_client),
    functions,
    estimate: {
      cgstPercent: toNumber(row.cgst_percent),
      cgstAmount: toNumber(row.cgst_amount),
      sgstPercent: toNumber(row.sgst_percent),
      sgstAmount: toNumber(row.sgst_amount),
      discount: toNumber(row.discount) || 0,
      roundOff: toNumber(row.round_off) || 0,
      grandTotal,
    },
    payments,
    advancePayments: payments,
    totalPaid,
    remainingPayment: Math.max(grandTotal - totalPaid, 0),
    notes: row.notes || '',
    previewedAt: row.previewed_at,
    updatedAt: row.updated_at,
  };
};

const billingRepository = {
  async findByEventId(eventId) {
    const [rows] = await pool.execute(
      `SELECT * FROM event_billing WHERE event_id = ? AND deleted_at IS NULL LIMIT 1`,
      [eventId]
    );
    if (!rows.length) return null;

    const billing = rows[0];
    const functions = await this.getFunctions(billing.id);
    const payments = await this.getPayments(billing.id);
    return formatBilling(billing, functions, payments);
  },

  async getFunctions(billingId) {
    const [rows] = await pool.execute(
      `SELECT * FROM event_billing_functions
       WHERE billing_id = ? AND deleted_at IS NULL
       ORDER BY sort_order, id`,
      [billingId]
    );

    const functions = [];
    for (const row of rows) {
      const [chargeRows] = await pool.execute(
        `SELECT * FROM event_billing_function_charges
         WHERE billing_function_id = ? AND deleted_at IS NULL
         ORDER BY sort_order, id`,
        [row.id]
      );

      const extraAmount = toNumber(row.extra_charges) || 0;

      functions.push({
        id: String(row.id),
        eventFunctionId: row.event_function_id ? String(row.event_function_id) : null,
        name: row.name,
        description: row.description || '',
        date: row.function_date,
        startTime: toMysqlTime(row.start_time),
        pax: row.pax,
        extraCharges: extraAmount,
        extraAmount,
        ratePerPlate: toNumber(row.rate_per_plate),
        amount: toNumber(row.amount),
        charges: chargeRows.map((c) => ({
          id: String(c.id),
          label: c.label,
          description: c.label,
          amount: toNumber(c.amount) || 0,
        })),
      });
    }

    return functions;
  },

  async getPayments(billingId) {
    const [rows] = await pool.execute(
      `SELECT * FROM event_billing_payments
       WHERE billing_id = ? AND deleted_at IS NULL
       ORDER BY sort_order, id`,
      [billingId]
    );

    return rows.map((row) => ({
      id: String(row.id),
      amount: toNumber(row.amount) || 0,
      paidAt: row.paid_at,
      description: row.description || '',
    }));
  },

  async save(eventId, data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.execute(
        `SELECT id, deleted_at FROM event_billing WHERE event_id = ? LIMIT 1`,
        [eventId]
      );

      let billingId;
      const estimate = data.estimate || {};
      const billingValues = [
        data.showToClient ? 1 : 0,
        estimate.cgstPercent ?? null,
        estimate.cgstAmount ?? null,
        estimate.sgstPercent ?? null,
        estimate.sgstAmount ?? null,
        estimate.discount ?? 0,
        estimate.roundOff ?? 0,
        estimate.grandTotal ?? null,
        data.notes ?? null,
        data.showToClient ? new Date() : null,
      ];

      if (existing.length) {
        billingId = existing[0].id;
        if (existing[0].deleted_at) {
          await conn.execute('UPDATE event_billing SET deleted_at = NULL WHERE id = ?', [billingId]);
        }
        await conn.execute(
          `UPDATE event_billing SET
            show_to_client = ?,
            cgst_percent = ?,
            cgst_amount = ?,
            sgst_percent = ?,
            sgst_amount = ?,
            discount = ?,
            round_off = ?,
            grand_total = ?,
            notes = ?,
            previewed_at = CASE WHEN ? = 1 THEN NOW() ELSE previewed_at END,
            updated_at = NOW()
           WHERE id = ?`,
          [...billingValues.slice(0, 9), data.showToClient ? 1 : 0, billingId]
        );
      } else {
        const [result] = await conn.execute(
          `INSERT INTO event_billing (
            event_id, show_to_client, cgst_percent, cgst_amount, sgst_percent, sgst_amount,
            discount, round_off, grand_total, notes, previewed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [eventId, ...billingValues]
        );
        billingId = result.insertId;
      }

      await conn.execute(
        `UPDATE event_billing_function_charges c
         INNER JOIN event_billing_functions f ON f.id = c.billing_function_id
         SET c.deleted_at = NOW()
         WHERE f.billing_id = ? AND c.deleted_at IS NULL AND f.deleted_at IS NULL`,
        [billingId]
      );
      await conn.execute(
        'UPDATE event_billing_functions SET deleted_at = NOW() WHERE billing_id = ? AND deleted_at IS NULL',
        [billingId]
      );
      await conn.execute(
        'UPDATE event_billing_payments SET deleted_at = NOW() WHERE billing_id = ? AND deleted_at IS NULL',
        [billingId]
      );

      const functions = data.functions || [];
      for (const [i, fn] of functions.entries()) {
        const [fnResult] = await conn.execute(
          `INSERT INTO event_billing_functions (
            billing_id, event_function_id, name, description, function_date, start_time, pax,
            extra_charges, rate_per_plate, amount, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            billingId,
            fn.eventFunctionId || null,
            fn.name,
            fn.description || null,
            toMysqlDate(fn.date),
            toMysqlTime(fn.startTime),
            fn.pax ?? null,
            fn.extraCharges ?? fn.extraAmount ?? 0,
            fn.ratePerPlate ?? null,
            fn.amount ?? null,
            i,
          ]
        );

        const billingFunctionId = fnResult.insertId;
        const charges = fn.charges || [];
        for (const [j, charge] of charges.entries()) {
          await conn.execute(
            `INSERT INTO event_billing_function_charges (billing_function_id, label, amount, sort_order)
             VALUES (?, ?, ?, ?)`,
            [billingFunctionId, charge.label, charge.amount ?? 0, j]
          );
        }
      }

      const payments = data.payments || [];
      for (const [i, payment] of payments.entries()) {
        await conn.execute(
          `INSERT INTO event_billing_payments (billing_id, amount, paid_at, description, sort_order)
           VALUES (?, ?, ?, ?, ?)`,
          [
            billingId,
            payment.amount ?? 0,
            toMysqlDateTime(payment.paidAt),
            payment.description || null,
            i,
          ]
        );
      }

      await conn.commit();
      return billingId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },
};

module.exports = billingRepository;
