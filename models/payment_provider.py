from odoo import _, models, fields, api

from odoo.addons.payment_pagoplux import const

URL_FUNCTION_PPX = 'https://{}.pagoplux.com/paybox/index_function.js' 
ENVIRONMENT_TEST = 'sandbox'
ENVIRONMENT_PROD = 'prod'

class AcquirerPagoplux(models.Model):
    _inherit = 'payment.provider'

    # provider = fields.Selection(
    #     selection_add=[('pagoplux', "PagoPlux")]
    # )

    provider = fields.Selection([
    ('pagoplux', 'pagoplux')
    ],string="pagoplux", default='pagoplux')

    code = fields.Selection(
        selection_add=[('pagoplux', "PagoPlux")], ondelete={'pagoplux': 'set default'}
    )

    paybox_remail = fields.Char(required_if_provider='pagoplux')
    paybox_rename = fields.Char(required_if_provider='pagoplux')
  
    """
    @api.model
    def _create_missing_journal_for_acquirers(self, company=None):
        # By default, the wire transfer method uses the default Bank journal.
        company = company or self.env.company
        acquirers = self.env['payment.acquirer'].search(
            [('provider', '=', 'pagoplux'), ('journal_id', '=', False), ('company_id', '=', company.id)])

        bank_journal = self.env['account.journal'].search(
            [('type', '=', 'bank'), ('company_id', '=', company.id)], limit=1)
        if bank_journal:
            acquirers.write({'journal_id': bank_journal.id})
        return super(AcquirerPagoplux, self)._create_missing_journal_for_acquirers(company=company)
    """

    @api.model
    def _get_pagoplux_urls(self, acquierer_ppx):
        """
        Permite obtener las urls del ambiente para los pagos
        """
        environment = acquierer_ppx.state
        ppx_remail = acquierer_ppx.paybox_remail
        ppx_rename = acquierer_ppx.paybox_rename
        # Por defecto sandbox
        ppx_environment = ENVIRONMENT_TEST
        ppx_is_production = False
        ppx_url_pay = URL_FUNCTION_PPX.format('sandbox-paybox')
        """ Pagoplux URLS """
        if environment == 'enabled':
            ppx_url_pay = URL_FUNCTION_PPX.format('paybox')
            ppx_environment = ENVIRONMENT_PROD    
            ppx_is_production = True 
        return {
            'ppx_remail': ppx_remail, 
            'ppx_rename': ppx_rename, 
            'ppx_environment': ppx_environment, 
            'ppx_url_pay': ppx_url_pay,
            'ppx_is_production': ppx_is_production
        }

    def pagoplux_form_generate_values(self, tx_values):
        self.ensure_one()
        referece = tx_values.get('reference')        
        """
        Permite aumentar o definir las variables que irán en el formulario
        """
        return tx_values


    def pagoplux_get_form_action_url(self):
        """
        Permite regresar a la url especificada una vez escogido este tipo de pago
        Ya que en pagoplux no redirecciona a otra página se coloca ''
        """
        return '/payment/pagoplux/success'

    @api.model
    def pagoplux_s2s_form_process(self, data):     
        return data
    
    def _get_default_payment_method_codes(self):
        """ Override of `payment` to return the default payment method codes. """
        default_codes = super()._get_default_payment_method_codes()
        if self.code != 'pagoplux':
            return default_codes
        return const.DEFAULT_PAYMENT_METHODS_CODES
    
    def _get_pagoplux_urls(self, acquierer_ppx):
        """
        Permite obtener las urls del ambiente para los pagos
        """
        environment = acquierer_ppx.state
        ppx_remail = acquierer_ppx.paybox_remail
        ppx_rename = acquierer_ppx.paybox_rename
        # Por defecto sandbox
        ppx_environment = ENVIRONMENT_TEST
        ppx_is_production = False
        ppx_url_pay = URL_FUNCTION_PPX.format('sandbox-paybox')
        """ Pagoplux URLS """
        if environment == 'enabled':
            ppx_url_pay = URL_FUNCTION_PPX.format('paybox')
            ppx_environment = ENVIRONMENT_PROD    
            ppx_is_production = True 
        return {
            'ppx_remail': ppx_remail, 
            'ppx_rename': ppx_rename, 
            'ppx_environment': ppx_environment, 
            'ppx_url_pay': ppx_url_pay,
            'ppx_is_production': ppx_is_production
        }