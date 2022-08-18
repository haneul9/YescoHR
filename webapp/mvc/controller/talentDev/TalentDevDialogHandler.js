sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/exceptions/UI5Error',
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
    UI5Error,
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
                this.oDialogModel.setProperty('/Original', null);
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
                  Visible: {
                    Upload: !bUploaded1 && bUploadAuth && bEditAuth && !bViewMode && !bFile1Hide,
                    Download: bUploaded1 && !bFile1Hide,
                    Remove: bUploaded1 && bUploadAuth && bEditAuth && !bViewMode && !bFile1Hide,
                  },
                  Request: { ServiceUrl, UploadUrl, FileTypes, CsrfToken: null, Appno: mPopupData.Appno1, Zworktyp, Zfilename: null, EncodedFilename: null, Zbinkey: null, Zfileseq },
                  Keys: { AppnoName: 'Appno1', Gjahr, Pernr, Zseqnr, Werks: mPopupData.Werks, Mdate },
                },
                // 통합리포트
                Attachment2: {
                  Visible: {
                    Upload: !bUploaded2 && bUploadAuth && bEditAuth && !bViewMode,
                    Download: bUploaded2,
                    Remove: bUploaded2 && bUploadAuth && bEditAuth && !bViewMode,
                  },
                  Request: { ServiceUrl, UploadUrl, FileTypes, CsrfToken: null, Appno: mPopupData.Appno2, Zworktyp, Zfilename: null, EncodedFilename: null, Zbinkey: null, Zfileseq },
                  Keys: { AppnoName: 'Appno2', Gjahr, Pernr, Zseqnr, Werks: mPopupData.Werks, Mdate },
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

      /**
       * 설정에 없는 파일 확장자가 선택된 경우 발생하는 event
       *
       * @param {*} oEvent
       */
      onTypeMissmatch(oEvent) {
        this.oController.onTypeMissmatch(oEvent);
      },

      /**
       * FileUploader 파일 선택시 발생하는 event
       *
       * @param {*} oEvent
       */
      async onUploaderChange(oEvent) {
        this.setBusy();
        const bSuccess = await this.oController.uploadFile(oEvent);
        if (!bSuccess) {
          this.setBusy(false);
        }
      },

      /**
       * Upload 완료 후 발생하는 event, upload 실패시에도 발생
       *
       * @param {*} oEvent
       */
      async onUploadComplete(oEvent) {
        const sAppnoName = oEvent.getSource().getBindingContext().getProperty('Keys/AppnoName'); // Appno1 or Appno2

        await this.oController.updateFileData(oEvent, (sAppno) => {
          this.oController.retrieve('2');
          // await this.retrieveDetailData(this.initParams);
          this.oDialogModel.setProperty(`/Detail/${sAppnoName}`, sAppno);
          this.oDialogModel.setProperty(`/Original/${sAppnoName}`, sAppno);
          this.displayFileIcons(this.oDialogModel.getProperty('/Detail'));
        });

        this.setBusy(false);
      },

      onPressFileDownload(oEvent) {
        this.oController.onPressFileDownload(oEvent);
      },

      async onPressFileRemove(oEvent) {
        this.setBusy();

        const sAppnoName = oEvent.getSource().getBindingContext().getProperty('Keys/AppnoName'); // Appno1 or Appno2

        await this.oController.removeFile(oEvent, () => {
          this.oController.retrieve('2');
          // this.retrieveDetailData(this.initParams);
          this.oDialogModel.setProperty(`/Detail/${sAppnoName}`, '0');
          this.oDialogModel.setProperty(`/Original/${sAppnoName}`, '0');
          this.displayFileIcons(this.oDialogModel.getProperty('/Detail'));
        });

        this.setBusy(false);
      },

      onPressEdit() {
        this.oDialogModel.setProperty('/Original/ViewMode', false);
        this.oDialogModel.setProperty('/Detail/ViewMode', false);
        this.displayFileIcons(this.oDialogModel.getProperty('/Detail'));
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
          const bComplete = this.oDialogModel.getProperty('/Detail/Mode') === 'C';
          const bDivisionManager = this.oDialogModel.getProperty('/Detail/Setrc') === 'X';
          if (bComplete && bDivisionManager) {
            const [sEmailSend, sEmailNotSend, sCancel] = [
              this.oController.getBundleText('LABEL_00114'), // 확인
              this.oController.getBundleText('LABEL_43016'), // 확인(메일 미발송)
              this.oController.getBundleText('LABEL_00118'), // 취소
            ];
            const bGoOn = await new Promise((resolve) => {
              // 완료 처리에 의해 대상자의 부문장에게 알림 메일이 발송됩니다.
              MessageBox.confirm(this.oController.getBundleText('MSG_43005'), {
                actions: [sEmailSend, sEmailNotSend, sCancel],
                styleClass: 'w-450-px',
                onClose: (sAction) => {
                  if (sAction === sEmailSend) {
                    this.oDialogModel.setProperty('/Detail/Mailc', 'X');
                    resolve(true);
                  } else if (sAction === sEmailNotSend) {
                    this.oDialogModel.setProperty('/Detail/Mailc', '');
                    resolve(true);
                  } else if (sAction === sCancel) {
                    this.oDialogModel.setProperty('/Detail/Mailc', '');
                    resolve(false);
                  }
                },
              });
            });
            if (!bGoOn) {
              return;
            }
          }

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

      displayFileIcons({ Appno1, Appno2, File1Hide, FileupChk, AuthChange }) {
        const [
          bUploaded1, // 심리분석보고서 첨부파일 존재 여부
          bUploaded2, // 통합리포트 첨부파일 존재 여부
          bFile1Hide, // 심리분석보고서 첨부파일 조회 권한 여부
          bUploadAuth, // 첨부파일 업로드 권한 여부
          bEditAuth, // 인재육성위원회 항목 작성/수정 권한 여부
        ] = [
          Number(Appno1) > 0, //
          Number(Appno2) > 0,
          File1Hide === 'X',
          FileupChk === 'X',
          AuthChange === 'X',
        ];
        const [
          bVisibleUpload1, // 심리분석보고서 업로드 아이콘 보임 여부
          bVisibleDownload1, // 심리분석보고서 다운로드 아이콘 보임 여부
          bVisibleRemove1, // 심리분석보고서 삭제 아이콘 보임 여부
          bVisibleUpload2, // 통합리포트 업로드 아이콘 보임 여부
          bVisibleDownload2, // 통합리포트 다운로드 아이콘 보임 여부
          bVisibleRemove2, // 통합리포트 삭제 아이콘 보임 여부
        ] = [
          !bUploaded1 && bUploadAuth && bEditAuth && !bFile1Hide, //
          bUploaded1 && !bFile1Hide,
          bUploaded1 && bUploadAuth && bEditAuth && !bFile1Hide,
          !bUploaded2 && bUploadAuth && bEditAuth,
          bUploaded2,
          bUploaded2 && bUploadAuth && bEditAuth,
        ];
        this.oDialogModel.setProperty('/Original/Attachment1/Visible/Upload', bVisibleUpload1);
        this.oDialogModel.setProperty('/Original/Attachment1/Visible/Download', bVisibleDownload1);
        this.oDialogModel.setProperty('/Original/Attachment1/Visible/Remove', bVisibleRemove1);
        this.oDialogModel.setProperty('/Original/Attachment2/Visible/Upload', bVisibleUpload2);
        this.oDialogModel.setProperty('/Original/Attachment2/Visible/Download', bVisibleDownload2);
        this.oDialogModel.setProperty('/Original/Attachment2/Visible/Remove', bVisibleRemove2);
        this.oDialogModel.setProperty('/Detail/Attachment1/Visible/Upload', bVisibleUpload1);
        this.oDialogModel.setProperty('/Detail/Attachment1/Visible/Download', bVisibleDownload1);
        this.oDialogModel.setProperty('/Detail/Attachment1/Visible/Remove', bVisibleRemove1);
        this.oDialogModel.setProperty('/Detail/Attachment2/Visible/Upload', bVisibleUpload2);
        this.oDialogModel.setProperty('/Detail/Attachment2/Visible/Download', bVisibleDownload2);
        this.oDialogModel.setProperty('/Detail/Attachment2/Visible/Remove', bVisibleRemove2);
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
