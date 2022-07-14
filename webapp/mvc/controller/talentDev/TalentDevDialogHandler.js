sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    AppUtils,
    Debuggable,
    Client,
    ServiceNames,
    MessageBox
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.mvc.controller.talentDev.TalentDevDialogHandler', {
      constructor: function (oController) {
        this.oController = oController;
        this.fnCallback = null;
        this.oDialog = null;
        this.oDialogModel = new JSONModel(this.getInitialData());
      },

      getInitialData() {
        return {
          busy: true,
          Detail: {},
          ZstatEntry: [],
        };
      },

      setCallback(fnCallback) {
        this.fnCallback = fnCallback;
        return this;
      },

      async openDialog({ Pernr, Gjahr, Mdate, Zseqnr, FileupChk, AuthChange }) {
        this.setBusy();

        if (!this.oDialog) {
          const oView = this.oController.getView();

          const [aZstatEntry, oDialog] = await Promise.all([
            Client.getEntitySet(this.oController.getModel(ServiceNames.TALENT), 'GetZstatList'),
            Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.talentDev.fragment.TalentDevDialog',
              controller: this,
            }),
          ]);

          this.oDialog = oDialog;
          this.oDialogModel.setProperty(
            '/ZstatEntry',
            _.map(aZstatEntry, (o) => _.chain(o).omit('__metadata').value())
          );

          this.oDialog //
            .setModel(this.oDialogModel)
            .bindElement('/')
            .attachAfterClose(() => {
              setTimeout(() => {
                this.oDialogModel.setProperty('/Detail', null);
              });
            });

          oView.addDependent(this.oDialog);
        }

        setTimeout(async () => {
          try {
            const [mPopupData] = await Client.getEntitySet(this.oController.getModel(ServiceNames.TALENT), 'TalentDevDetail', { Pernr, Gjahr, Mdate, Zseqnr });
            const mOriginal = {
              ..._.chain(mPopupData)
                .omit('__metadata')
                .update('Zstat', (sZstat) => (_.chain(sZstat).parseInt().isNaN().value() ? '0' : sZstat))
                .set('Completed', mPopupData.Zstat === '2')
                .value(),
              FileupChk,
              AuthChange,
            };
            this.oDialogModel.setProperty('/Original', mOriginal);
            this.oDialogModel.setProperty('/Detail', { ...mOriginal });
            this.oDialog.open();
          } catch (oError) {
            AppUtils.debug('Controller > talentDev > TalentDevDialogHandler > openDialog Error', oError);
            AppUtils.handleError(oError);
          } finally {
            this.setBusy(false);
          }
        });
      },

      onPressPhoto(oEvent) {
        const sHost = window.location.href.split('#')[0];
        const { Pernr } = oEvent.getSource().getBindingContext().getProperty('/Detail');

        window.open(`${sHost}#/employeeView/${Pernr}/M`, '_blank', 'width=1400,height=800');
      },

      onPressFileDownload(oEvent) {
        this.oController.onPressFileDownload(oEvent);
      },

      onPressFileUpload(oEvent) {
        this.oController.onPressFileUpload(oEvent);
      },

      onPressFileDelete(oEvent) {
        this.oController.onPressFileDelete(oEvent);
      },

      onPressEdit() {
        this.oDialogModel.setProperty('/Detail/Completed', false);
      },

      onPressSave() {
        const sMessageCode = 'LABEL_00103'; // 저장
        const sYes = this.oController.getBundleText(sMessageCode);

        // {sMessageCode}하시겠습니까?
        MessageBox.confirm(this.oController.getBundleText('MSG_00006', sMessageCode), {
          actions: [
            sYes,
            this.oController.getBundleText('LABEL_00118'), // 취소
          ],
          onClose: (sAction) => {
            if (sAction !== sYes) {
              return;
            }

            const sZstat = this.oDialogModel.getProperty('/Detail/Zstat');
            this.oDialogModel.setProperty('/Detail/Mode', sZstat === '2' ? 'C' : 'S');
            this.saveData(sMessageCode);
          },
        });
      },

      onPressComplete() {
        const sMessageCode = 'LABEL_00117'; // 완료
        const sYes = this.oController.getBundleText(sMessageCode);

        // {sMessageCode}하시겠습니까?
        MessageBox.confirm(this.oController.getBundleText('MSG_00006', sMessageCode), {
          actions: [
            sYes,
            this.oController.getBundleText('LABEL_00118'), // 취소
          ],
          onClose: (sAction) => {
            if (sAction !== sYes) {
              return;
            }

            this.oDialogModel.setProperty('/Detail/Mode', 'C');
            this.saveData(sMessageCode); // 완료
          },
        });
      },

      async saveData(sMessageCode) {
        this.setBusy();
        try {
          await Client.create(this.oController.getModel(ServiceNames.TALENT), 'TalentDevDetail', { ...this.oDialogModel.getProperty('/Detail') });

          // {sMessageCode}되었습니다.
          MessageBox.alert(this.oController.getBundleText('MSG_00007', sMessageCode), {
            onClose: () => {
              this.fnCallback();
              this.oDialog.close();
            },
          });
        } catch (oError) {
          AppUtils.debug('Controller > talentDev > TalentDevDialogHandler > saveData Error', oError);
          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      onPressDialogClose() {
        const mOriginal = this.oDialogModel.getProperty('/Original');
        const mDetail = this.oDialogModel.getProperty('/Detail');
        const [mChangedDetail] = _.differenceWith([mDetail], [mOriginal], _.isEqual);
        if (!mChangedDetail) {
          this.oDialog.close();
          return;
        }

        // 변경사항이 저장되지 않았습니다. 이대로 닫으시겠습니까?
        MessageBox.confirm(this.oController.getBundleText('MSG_43003'), {
          onClose: (sAction) => {
            if (sAction !== MessageBox.Action.OK) {
              return;
            }

            this.oDialog.close();
          },
        });
      },

      setBusy(bBusy = true) {
        setTimeout(() => {
          this.oDialogModel.setProperty('/busy', bBusy);
        });
        return this;
      },
    });
  }
);