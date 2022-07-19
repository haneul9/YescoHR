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
            .attachAfterOpen(() => {
              [...this.oDialog.getButtons()].pop().$().focus();
            })
            .attachAfterClose(() => {
              setTimeout(() => {
                this.oDialogModel.setProperty('/Detail', null);
              });
            });

          oView.addDependent(this.oDialog);
        }

        this.initParams = { Pernr, Gjahr, Mdate, Zseqnr, FileupChk, AuthChange };

        this.retrieveDetailData(this.initParams);
      },

      async retrieveDetailData({ Pernr, Gjahr, Mdate, Zseqnr, FileupChk, AuthChange }) {
        try {
          const { ServiceUrl, UploadUrl, FileTypes, Zworktyp, Zfileseq } = this.oController.getFileConfig();
          const [mPopupData] = await Client.getEntitySet(this.oController.getModel(ServiceNames.TALENT), 'TalentDevDetail', { Pernr, Gjahr, Mdate, Zseqnr });
          const [
            bUploaded1, //
            bUploaded2,
            bFile1Hide,
            bUploadAuth,
            bEditAuth,
            bViewMode,
          ] = [
            Number(mPopupData.Appno1) > 0, //
            Number(mPopupData.Appno2) > 0,
            mPopupData.File1Hide === 'X',
            FileupChk === 'X',
            AuthChange === 'X',
            mPopupData.Zstat === '2',
          ];
          const mOriginal = {
            ..._.chain(mPopupData)
              .omit('__metadata')
              .update('Zstat', (sZstat) => (_.chain(sZstat).parseInt().isNaN().value() ? '0' : sZstat))
              .set('ViewMode', mPopupData.Zstat === '2')
              .merge({
                // 심리분석보고서
                Attachment1: {
                  ...mPopupData,
                  Visible: {
                    Upload: !bUploaded1 && bUploadAuth && bEditAuth && !bViewMode && !bFile1Hide,
                    Download: bUploaded1 && !bFile1Hide,
                    Remove: bUploaded1 && bUploadAuth && bEditAuth && !bViewMode && !bFile1Hide,
                  },
                  Request: { ServiceUrl, UploadUrl, FileTypes, CsrfToken: null, Appno: mPopupData.Appno1, Zworktyp, Zfilename: null, EncodedFilename: null, Zbinkey: null, Zfileseq },
                  AppnoName: 'Appno1',
                },
                // 통합리포트
                Attachment2: {
                  ...mPopupData,
                  Visible: {
                    Upload: !bUploaded2 && bUploadAuth && bEditAuth && !bViewMode,
                    Download: bUploaded2,
                    Remove: bUploaded2 && bUploadAuth && bEditAuth && !bViewMode,
                  },
                  Request: { ServiceUrl, UploadUrl, FileTypes, CsrfToken: null, Appno: mPopupData.Appno2, Zworktyp, Zfilename: null, EncodedFilename: null, Zbinkey: null, Zfileseq },
                  AppnoName: 'Appno2',
                },
              })
              .value(),
            FileupChk,
            AuthChange,
          };
          const bForceEditMode = this.oDialogModel.getProperty('/Detail/ViewMode') === false;
          this.oDialogModel.setProperty('/Original', mOriginal);
          this.oDialogModel.setProperty('/Detail', { ...mOriginal });
          if (bForceEditMode) {
            this.onPressEdit();
          }
          this.oDialog.open();
        } catch (oError) {
          AppUtils.debug('Controller > talentDev > TalentDevDialogHandler > openDialog Error', oError);

          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      onPressPhoto(oEvent) {
        const sHost = window.location.href.split('#')[0];
        const { Pernr } = oEvent.getSource().getBindingContext().getProperty('/Detail');

        window.open(`${sHost}#/employeeView/${Pernr}/M`, '_blank', 'width=1400,height=800');
      },

      async onUploaderChange(oEvent) {
        this.setBusy();
        const bSuccess = await this.oController.uploadFile(oEvent);
        if (!bSuccess) {
          this.setBusy(false);
        }
      },

      onTypeMissmatch(oEvent) {
        this.oController.onTypeMissmatch(oEvent);
      },

      async onUploadComplete(oEvent) {
        await this.oController.updateFileData(oEvent, async () => {
          this.oController.retrieve({ ...this.oController.mSelectedCommitteeData, Mode: '2' });
          await this.retrieveDetailData(this.initParams);
        });

        this.setBusy(false);
      },

      onPressFileDownload(oEvent) {
        this.oController.onPressFileDownload(oEvent);
      },

      async onPressFileRemove(oEvent) {
        this.setBusy();

        await this.oController.removeFile(oEvent, async () => {
          this.oController.retrieve({ ...this.oController.mSelectedCommitteeData, Mode: '2' });
          await this.retrieveDetailData(this.initParams);
        });

        this.setBusy(false);
      },

      onPressEdit() {
        const { Appno1, Appno2, File1Hide, FileupChk, AuthChange } = this.oDialogModel.getProperty('/Detail');
        const [
          bUploaded1, //
          bUploaded2,
          bFile1Hide,
          bUploadAuth,
          bEditAuth,
        ] = [
          Number(Appno1) > 0, //
          Number(Appno2) > 0,
          File1Hide === 'X',
          FileupChk === 'X',
          AuthChange === 'X',
        ];
        const [
          bVisibleUpload1, //
          bVisibleRemove1,
          bVisibleUpload2,
          bVisibleRemove2,
        ] = [
          !bUploaded1 && bUploadAuth && bEditAuth && !bFile1Hide, //
          bUploaded1 && bUploadAuth && bEditAuth && !bFile1Hide,
          !bUploaded2 && bUploadAuth && bEditAuth,
          bUploaded2 && bUploadAuth && bEditAuth,
        ];
        this.oDialogModel.setProperty('/Original/ViewMode', false);
        this.oDialogModel.setProperty('/Original/Attachment1/Visible/Upload', bVisibleUpload1);
        this.oDialogModel.setProperty('/Original/Attachment1/Visible/Remove', bVisibleRemove1);
        this.oDialogModel.setProperty('/Original/Attachment2/Visible/Upload', bVisibleUpload2);
        this.oDialogModel.setProperty('/Original/Attachment2/Visible/Remove', bVisibleRemove2);
        this.oDialogModel.setProperty('/Detail/ViewMode', false);
        this.oDialogModel.setProperty('/Detail/Attachment1/Visible/Upload', bVisibleUpload1);
        this.oDialogModel.setProperty('/Detail/Attachment1/Visible/Remove', bVisibleRemove1);
        this.oDialogModel.setProperty('/Detail/Attachment2/Visible/Upload', bVisibleUpload2);
        this.oDialogModel.setProperty('/Detail/Attachment2/Visible/Remove', bVisibleRemove2);
      },

      onPressSave() {
        this.setBusy();

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
              this.setBusy(false);
              return;
            }

            const sZstat = this.oDialogModel.getProperty('/Detail/Zstat');
            this.oDialogModel.setProperty('/Detail/Mode', sZstat === '2' ? 'C' : 'S');
            this.saveData(sMessageCode);
          },
        });
      },

      onPressComplete() {
        this.setBusy();

        const sMessageCode = 'LABEL_00117'; // 완료
        const sYes = this.oController.getBundleText(sMessageCode);

        // {완료}하시겠습니까?
        MessageBox.confirm(this.oController.getBundleText('MSG_00006', sMessageCode), {
          actions: [
            sYes,
            this.oController.getBundleText('LABEL_00118'), // 취소
          ],
          onClose: (sAction) => {
            if (sAction !== sYes) {
              this.setBusy(false);
              return;
            }

            this.oDialogModel.setProperty('/Detail/Mode', 'C');
            this.saveData(sMessageCode); // 완료
          },
        });
      },

      async saveData(sMessageCode) {
        try {
          await Client.create(this.oController.getModel(ServiceNames.TALENT), 'TalentDevDetail', { ...this.oDialogModel.getProperty('/Detail') });

          // {저장|완료}되었습니다.
          MessageBox.alert(this.oController.getBundleText('MSG_00007', sMessageCode), {
            onClose: () => {
              this.fnCallback();
              this.oDialog.close();
            },
          });
        } catch (oError) {
          AppUtils.debug('Controller > talentDev > TalentDevDialogHandler > saveData Error', oError);

          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
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
