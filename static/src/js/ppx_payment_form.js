/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { loadJS } from "@web/core/assets";
import paymentForm from '@payment/js/payment_form';
import { jsonrpc } from "@web/core/network/rpc_service";

paymentForm.include({
    /**
    * @override
    */
    setup() {
        this._super(...arguments);
        this.pagopluxData = null;
        this.ppxScriptLoaded = false;
    },


    /**
     * Obtiene el valor de un elemento del DOM
     * @private
     * @param {string} selector
     * @returns {string}
     */
    _getElementValue(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            return '';
        }
        return element ? (element.value || '').trim() : '';
    },

    /**
     * Inicializa PagoPlux verificando que el script se haya cargado correctamente
     * @private
     * @param {Object} providerInfo - Información del proveedor de pago
     * @returns {Promise}
     */
    async _initializePagoPlux(providerInfo) {
        if (!this.ppxScriptLoaded) {
            try {
                await loadJS(providerInfo.ppx_url_pay);
                this.ppxScriptLoaded = true;                
                if (typeof window.loadPaybox !== 'function') {
                    throw new Error("Las funciones de PagoPlux no se cargaron correctamente");
                }
                
                const originalConsoleLog = console.log;

                console.log = function (message, ...optionalParams) {
                    if (typeof message === 'string' && message.includes('Comercio no registrado en PagoPlux')) {
                        showErrorModal('Comercio no registrado en PagoPlux. Por favor, verifica tus credenciales.');
                    }
                    originalConsoleLog.call(console, message, ...optionalParams);
                };
            } catch (error) {
                throw new Error(`Error al cargar el script de PagoPlux: ${error.message}`);
            }
        }
    },

    /**
     * Prepare the inline form for PagoPlux payment.
     * @private
     */
    async _prepareInlineForm(providerId, providerCode, flow) {
        if (providerCode !== 'pagoplux') {
            return this._super(...arguments);
        }

        if (flow === 'token') {
            return;
        }

        this._setPaymentFlow('direct');
        try {
            const providerInfo = await jsonrpc('/payment/pagoplux/get_provider_info', {
                provider_id: providerId,
            });

            if (!document.getElementById('ButtonPaybox')) {
                document.body.insertAdjacentHTML('beforeend', '<div id="ButtonPaybox"/>');
            }

            await this._initializePagoPlux(providerInfo);
            
            // Configure PagoPlux data with direct values
            this.pagopluxData = {
                PayboxRemail: String(providerInfo.ppx_remail),
                PayboxSendmail: this._getElementValue('#PartnerEmail'),
                PayboxRename: String(providerInfo.ppx_rename),
                PayboxSendname: this._getElementValue('#PartnerName'),
                PayboxBase0: "0",
                PayboxBase12: this._getElementValue('#PayboxAmount') || '0',
                PayboxDescription: this._getElementValue('#PayboxDescription') || 'Pago',
                PayboxProduction: Boolean(providerInfo.ppx_is_production),
                PayboxLanguage: "es",
                PayboxRequired: [],
                PayboxEnvironment: String(providerInfo.ppx_environment || 'pre'),
                PayboxDirection: this._getElementValue('#PayboxDirection') || '',
                PayBoxClientPhone: this._getElementValue('#PayBoxClientPhone') || '',
                PayBoxClientName: this._getElementValue('#PartnerName') || '',
                PayBoxClientIdentification: $('#PayBoxClientIdentification').val(),
            };
            
            if(!this.pagopluxData.PayboxSendmail || !this.pagopluxData.PayboxSendname){
                let partnerId = this._getElementValue('#PartnerId')
                if(partnerId){
                    let partnerInfo = await _getPartnerNameEmail(Number(partnerId));
                    this.pagopluxData.PayboxSendmail = partnerInfo.email
                    this.pagopluxData.PayboxSendname = partnerInfo.name
                }

            }

            window.data = this.pagopluxData;

        } catch (error) {
            this._displayErrorDialog(
                _t("Pagoplux"),
                _t("Error al cargar el formulario de pago") + ': ' + error.message
            );
        }
    },

    /**
     * Process the direct payment flow for PagoPlux
     * @private
     */
    async _processDirectFlow(providerCode, paymentOptionId, paymentMethodCode, processingValues) {
        if (providerCode !== 'pagoplux') {
            return this._super(...arguments);
        }
        

        if (!this.pagopluxData) {
            this._displayErrorDialog(
                _t("Error de Configuración"),
                _t("La configuración de PagoPlux no se ha inicializado correctamente.")
            );
            return;
        }

        try {
            this.pagopluxData.PayboxDescription = String(processingValues.reference || 'Pago');
            window.data = this.pagopluxData;

            window.onAuthorize = async (response) => {
                if (response.status === 'succeeded') {
                    try {
                        
                        const dataToSend = {
                            reference: processingValues.reference,
                            partner_id: processingValues.partner_id,
                            amount: response.detail.amount,
                            cardInfo: response.detail.cardInfo,
                            cardIssuer: response.detail.cardIssuer,
                            cardType: response.detail.cardType,
                            clientID: response.detail.clientID,
                            clientName: response.detail.clientName,
                            fecha: response.detail.fecha,
                            id_transaccion: response.detail.id_transaccion,
                            state: response.detail.state,
                            token: response.detail.token,
                        };          
            
                        $.post('/payment/pagoplux/success', dataToSend)
                        .done((urlReturn) => {
                            window.location = urlReturn;
                        })
                        .fail((error) => {
                            console.error("Error al enviar datos de éxito:", error);
                            this._displayErrorDialog(
                                _t("Error de Procesamiento"),
                                _t("Ocurrió un error al procesar el pago.")
                            );
                        });
                    } catch (error) {
                        this._displayErrorDialog(
                            _t("Error de Procesamiento"),
                            _t("Ocurrió un error al procesar el pago.")
                        );
                        console.error("Error processing payment:", error);
                    }
                } else {
                    console.log('Pago no completado:', response);
                }
            };

            if (typeof window.loadPaybox === 'function') {
                setTimeout(() => {
                    window.loadPaybox(true);
                    const payboxModal = document.getElementById('paybox_modal');
                    if (payboxModal) {
                        payboxModal.setAttribute('aria-hidden', 'false');
                    }
                    this._setupCloseButtonHandler();
                }, 5000);
            } else {
                throw new Error(_t("La función loadPaybox no está disponible"));
            }
        } catch (error) {
            this._displayErrorDialog(
                _t("Error de Inicialización"),
                error.message || _t("Ocurrió un error desconocido al inicializar el pago.")
            );
            console.error("Error in _processDirectFlow:", error);
        }
    },

    /**
     * Configure el manejador del botón de cierre
     * @private
     */
    _setupCloseButtonHandler() {
        const closeButton = document.querySelector('.paybox_modal__close');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.reload();
            });
        }
    },
});

// Función para mostrar el modal de error
function showErrorModal(message) {
    // Crea el fondo oscuro
    const modalBackground = document.createElement('div');
    modalBackground.style.position = 'fixed';
    modalBackground.style.top = '0';
    modalBackground.style.left = '0';
    modalBackground.style.width = '100vw';
    modalBackground.style.height = '100vh';
    modalBackground.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modalBackground.style.zIndex = '9999';
    
    // Crea el contenedor del modal
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');
    modalContent.style.position = 'absolute';
    modalContent.style.top = '50%';
    modalContent.style.left = '50%';
    modalContent.style.transform = 'translate(-50%, -50%)';
    modalContent.style.width = '100%';
    modalContent.style.maxWidth = '500px';
    modalContent.style.borderRadius = '8px';
    
    // Crear header del modal (similar al ejemplo proporcionado)
    const modalHeader = document.createElement('header');
    modalHeader.classList.add('modal-header');
    modalHeader.style.backgroundColor = '#007bff';
    modalHeader.style.color = 'white';
    modalHeader.style.padding = '15px';
    modalHeader.style.borderTopLeftRadius = '8px';
    modalHeader.style.borderTopRightRadius = '8px';

    const modalTitle = document.createElement('h4');
    modalTitle.classList.add('modal-title', 'text-break');
    modalTitle.textContent = 'PagoPlux';
    modalHeader.appendChild(modalTitle);

    // Crear botón de cerrar
    const closeButton = document.createElement('button');
    closeButton.classList.add('btn-close');
    closeButton.setAttribute('type', 'button');
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.onclick = function () {
        location.reload();  // Cerrar el modal al hacer clic en el botón
    };
    modalHeader.appendChild(closeButton);

    // Crear el cuerpo del modal (contenido)
    const modalBody = document.createElement('main');
    modalBody.classList.add('modal-body');
    const modalMessage = document.createElement('p');
    modalMessage.classList.add('text-prewrap');
    modalMessage.textContent = message;
    modalBody.appendChild(modalMessage);

    // Crear pie del modal (botón de aceptar)
    const modalFooter = document.createElement('footer');
    modalFooter.classList.add('modal-footer', 'justify-content-around', 'justify-content-md-start', 'flex-wrap', 'gap-1', 'w-100');
    modalFooter.style.order = '2';
    
    const acceptButton = document.createElement('button');
    acceptButton.classList.add('btn', 'btn-primary');
    acceptButton.textContent = 'Ok';
    acceptButton.onclick = function () {
        location.reload();  // Recarga la página al hacer clic en aceptar
    };
    modalFooter.appendChild(acceptButton);

    // Añadir todo al modalContent
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);

    // Añadir el modalContent al modalBackground
    modalBackground.appendChild(modalContent);

    // Añadir el fondo al body
    document.body.appendChild(modalBackground);
}

async function _getPartnerNameEmail(partnerId) {
    const response = await fetch('/web/dataset/call_kw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
            jsonrpc: "2.0",
            method: "call",
            params: {
                model: "res.partner",
                method: "read",
                args: [[partnerId], ["name", "email"]],
                kwargs: {}
            },
            id: (new Date()).getTime()
        })
    });

    const data = await response.json();
    if (data.result && data.result.length > 0) {
        return {
            name: data.result[0].name,
            email: data.result[0].email
        };
    } else {
        return null; // no existe el partner
    }
}