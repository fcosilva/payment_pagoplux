SUPPORTED_CURRENCIES = [
    'USD',
]

# The codes of the payment methods to activate when Razorpay is activated.
DEFAULT_PAYMENT_METHODS_CODES = [
    # Primary payment methods.
    'pagoplux',
    # Brand payment methods.
    'visapagoplux',
    'mastercardpagoplux',
    'discoverpagoplux',
]

# The maximum amount in INR that can be paid through an eMandate.
MANDATE_MAX_AMOUNT = {
    'card': 1000000,
}