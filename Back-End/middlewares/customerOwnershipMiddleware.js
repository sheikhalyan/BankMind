const CustomerModel = require('../models/Customermodel');

const verifyCustomerOwnership = async (req, res, next) => {
    try {
        const customer_id = req.params.customer_id || req.params.customerId || req.body.customer_id;

        if (!customer_id)
            return res.status(400).json({ message: 'customer_id is required.' });

        const customer = await CustomerModel.findById(customer_id);
        if (!customer)
            return res.status(404).json({ message: 'Customer not found.' });

        // ADMIN bypasses ownership check
        if (req.user.role.toUpperCase() === 'ADMIN') {
            req.customer = customer;
            return next();
        }

        // STAFF — JWT payload uses `userId` not `user_id`
        if (customer.assigned_staff_id !== req.user.userId)
            return res.status(403).json({ message: 'This customer is not assigned to you.' });

        req.customer = customer;
        next();

    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
};

module.exports = verifyCustomerOwnership;