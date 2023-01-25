sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  function (
    // prettier 방지용 주석
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.csr.mobile.csrDetail', {
      getApprovalType() {
        return 'CSR0';
      },

      initializeModel() {
        return {
          busy: false,
          parameter: {},
          form: {
            Appryn: '',
          },
          approval: [],
        };
      },

      async onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        try {
          oViewModel.setProperty('/parameter', oParameter);

          await Promise.all([
            this.retrieveDocument(), //
            this.retrieveApproval(),
          ]);
          this.settingsAttachTable();
        } catch (oError) {
          this.debug(`Controller > mobile csrAppr Detail > onObjectMatched Error`, oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async retrieveDocument() {
        const oViewModel = this.getViewModel();

        try {
          const oModel = this.getModel(ServiceNames.COMMON);
          const mParam = oViewModel.getProperty('/parameter');
          const [mDocumentData] = await Client.getEntitySet(oModel, 'CsrRequest', {
            Appno: mParam.appno,
            Werks: mParam.werks,
          });

          oViewModel.setProperty('/form', {
            ...mDocumentData,
            Apcnt: this.wrapHTMLContent(mDocumentData.Apcnt),
            Testc1: this.wrapHTMLContent(mDocumentData.Testc1),
            Testc2: this.wrapHTMLContent(mDocumentData.Testc2),
          });
        } catch (oError) {
          throw oError;
        }
      },

      async retrieveApproval() {
        const oViewModel = this.getViewModel();

        try {
          const oModel = this.getModel(ServiceNames.COMMON);
          const mParam = oViewModel.getProperty('/parameter');
          const aApprovalData = await Client.getEntitySet(oModel, 'CsrRequestApproval', {
            Appno: mParam.appno,
            Werks: mParam.werks,
          });

          const mRequestData = aApprovalData[0] || {};

          oViewModel.setProperty('/form/ReqdatFormatted', `${this.DateUtils.format(mRequestData.Datum)} ${_.replace(mRequestData.Uzeittx, /(\d{2})(?=\d)/g, '$1:')}`);
          oViewModel.setProperty(
            '/approval',
            _.chain(aApprovalData)
              .map((el) => ({
                Ename: el.Ename,
                Prstatx: el.Prstatx,
                DatumFormatted: el.Datum ? `${this.DateUtils.format(el.Datum)} ${_.replace(el.Uzeittx, /(\d{2})(?=\d)/g, '$1:')}` : '',
              }))
              .reduce((acc, cur) => [...acc, { label: cur.Prstatx }, { label: cur.Ename }, { label: cur.DatumFormatted }], [])
              .value()
          );
        } catch (oError) {
          throw oError;
        }
      },

      async processApproval(vPrcty) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        const sMessage = vPrcty === 'B' ? 'LABEL_00123' : 'LABEL_00124';

        // {승인|반려}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', sMessage), {
          actions: [
            MessageBox.Action.CANCEL, //
            MessageBox.Action.OK,
          ],
          onClose: async (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) {
              oViewModel.setProperty('/busy', false);
              return;
            }

            try {
              await this.createApproval(vPrcty, sMessage);
            } catch (oError) {
              this.debug('Controller > Mobile csrAppr Detail > processApproval Error', oError);

              AppUtils.handleError(oError);
            } finally {
              oViewModel.setProperty('/busy', false);
            }
          },
        });
      },

      async createApproval(vPrcty, sMessage) {
        const oViewModel = this.getViewModel();

        try {
          const oModel = this.getModel(ServiceNames.COMMON);
          const mFormData = oViewModel.getProperty('/form');

          mFormData.Prcty = vPrcty;

          // 승인시 진행상태 값
          if (vPrcty === 'B') {
            mFormData.Prsta = this.nextStepStatus(mFormData.Prsta);
          }

          await Client.create(oModel, 'CsrRequestApproval', { ...mFormData });

          // {승인|반려}되었습니다.
          MessageBox.alert(this.getBundleText('MSG_00007', sMessage), {
            onClose: () => this.onNavBack(),
          });
        } catch (oError) {
          throw oError;
        }
      },

      nextStepStatus(sPrsta) {
        const iPrsta = _.toInteger(sPrsta);
        let sReturnStatus = '';

        switch (true) {
          case iPrsta === 10:
            sReturnStatus = '11';
            break;
          case iPrsta === 11:
            sReturnStatus = '12';
            break;
          case iPrsta >= 22:
            sReturnStatus = '30';
            break;
          default:
            sReturnStatus = sPrsta;
            break;
        }

        return sReturnStatus;
      },

      wrapHTMLContent(sHtml) {
        return ['<div class="editor-view mb-20-px">', sHtml, '</div>'].join('');
      },

      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const sAppno = oViewModel.getProperty('/form/Appno') || '';

        this.AttachFileAction.setAttachFile(this, {
          Max: 10,
          Type: this.getApprovalType(),
          Appno: sAppno,
          Editable: false,
        });
      },

      onPressApproval() {
        this.processApproval('B');
      },

      onPressReject() {
        this.processApproval('C');
      },
    });
  }
);
