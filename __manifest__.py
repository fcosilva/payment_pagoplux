# -*- coding: utf-8 -*-
{
    'name': "PagoPlux Payment",
    'version': '3.0.0',
    'category': 'Accounting/Payment Providers',
    'sequence': 350,
    'summary': """ PagoPlux Payment """,
    'description': """
        Realice sus pagos mediante Pagoplux
    """,
    'author': "Pagoplux",
    'license': 'LGPL-3',
    'website': "https://www.pagoplux.com/",
    
    'depends': [
        'payment', 
        'l10n_ec', 
        'l10n_ec_website_sale'],
    'data': [
        'data/payment_method_data.xml',
        'views/payment_pagoplux_provider_view.xml',
        'views/payment_pagoplux_template.xml',

        'data/payment_provider_data.xml',
    ],
    'images': ['static/src/img/logo.png'],
    'assets': {
        'web.assets_frontend': [
            'payment_pagoplux/static/src/js/ppx_payment_form.js',
            'payment_pagoplux/static/src/**/*',
        ],
    },
    'installable': True,
    'post_init_hook': 'post_init_hook',
    'uninstall_hook': 'uninstall_hook',
}
