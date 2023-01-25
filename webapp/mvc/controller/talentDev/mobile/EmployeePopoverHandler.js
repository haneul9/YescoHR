/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/odata/ODataModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/FileDataProvider',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceManager',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/talentDev/employeeView/MobileTalentDevPopoverHandler',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    ODataModel,
    AppUtils,
    Debuggable,
    FileDataProvider,
    UI5Error,
    Client,
    ServiceManager,
    ServiceNames,
    MessageBox,
    MobileTalentDevPopoverHandler
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.mvc.controller.talentDev.mobile.EmployeePopoverHandler', {
      COMPANY_ICON: {
        1000: AppUtils.getImageURL('icon_YH.svg'),
        2000: AppUtils.getImageURL('icon_YS.svg'),
        3000: AppUtils.getImageURL('icon_HS.svg'),
        4000: AppUtils.getImageURL('icon_YI.svg'),
        5000: AppUtils.getImageURL('icon_YH.svg'),
      },

      constructor: function (oController) {
        this.oController = oController;
        this.fnCallback = null;
        this.oPopover = null;
        this.oPopoverModel = new JSONModel(this.getInitialData());
        this.oMobileTalentDevPopoverHandler = new MobileTalentDevPopoverHandler(this.oController);
      },

      getInitialData() {
        const ServiceUrl = ServiceManager.getServiceUrl(ServiceNames.COMMON);
        return {
          busy: {
            Employee: true,
          },
          employee: {
            listInfo: {
              list: [],
              rowCount: 1,
              totalCount: 0,
              readyCount: 0,
              progressCount: 0,
              completeCount: 0,
              infoMessage: this.getBundleText('MSG_43001'), // 조회 조건에 따른 대상자입니다.
            },
            auth: {
              retrieval: false,
              change: false,
            },
          },
          fileConfig: {
            ServiceUrl,
            UploadUrl: `${ServiceUrl}/FileUploadSet`,
            FileTypes: 'ppt,pptx,doc,docx,xls,xlsx,jpg,jpeg,bmp,gif,png,txt,pdf',
            Zworktyp: 9050,
            Zfileseq: 1,
          },
        };
      },

      setCallback(fnCallback) {
        this.fnCallback = fnCallback;
        return this;
      },

      async openPopover(mSelectedCommitteeData) {
        this.setBusy();

        if (!this.oPopover) {
          const oView = this.oController.getView();

          this.oPopover = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.talentDev.mobile.fragment.EmployeePopover',
            controller: this,
          });

          this.oPopover //
            .setModel(this.oPopoverModel)
            .attachBeforeOpen(async () => {
              const [mAuth] = await Client.getEntitySet(this.oController.getModel(ServiceNames.TALENT), 'TalentDevAuth');

              this.oPopoverModel.setProperty('/employee/auth', _.chain(mAuth).omit('__metadata').value());
            })
            .attachAfterClose(() => {
              setTimeout(() => {
                this.oPopoverModel.setData(this.getInitialData());
              });
            });

          oView.addDependent(this.oPopover);
        }

        this.mSelectedCommitteeData = mSelectedCommitteeData;
        this.retrieveEmployeeData();
        this.oPopover.openBy(AppUtils.getMobileHomeButton());
      },

      async retrieveEmployeeData() {
        try {
          const mPayload = { ...this.mSelectedCommitteeData, Mode: '2', TalentDevTargetSet: [] };
          const aData = await Client.deep(this.oController.getModel(ServiceNames.TALENT), 'TalentDev', { ...mPayload });

          const { ServiceUrl, UploadUrl, FileTypes, Zworktyp, Zfileseq } = this.getFileConfig();
          const aEmployeeList = _.map(aData.TalentDevTargetSet.results, (o) => {
            const { Gjahr, Pernr, Zseqnr, Werks, Mdate } = o;
            const sUnknownAvatarImageURL = this.oController.getUnknownAvatarImageURL();
            return _.chain(o)
              .omit('__metadata')
              .set('Icon', this.COMPANY_ICON[o.Werks])
              .update('Photo', (sPhoto) => (_.chain(sPhoto).trim().isEmpty().value() ? sUnknownAvatarImageURL : sPhoto))
              .update('Zstat', (sZstat) => (_.chain(sZstat).parseInt().isNaN().value() ? '0' : sZstat))
              .merge({
                DescFlag: o.Desc === 'X' ? 'O' : '', // 엑셀 다운로드용
                // 심리분석보고서
                Attachment1: {
                  Visible: {
                    Upload: Number(o.Appno1) === 0 && o.FileupChk === 'X' && o.Zstat !== '2',
                    Download: Number(o.Appno1) > 0,
                    DownloadFlag: Number(o.Appno1) > 0 ? 'O' : '', // 엑셀 다운로드용
                    Remove: Number(o.Appno1) > 0 && o.FileupChk === 'X' && o.Zstat !== '2',
                  },
                  Request: { ServiceUrl, UploadUrl, FileTypes, CsrfToken: null, Appno: o.Appno1, Zworktyp, Zfilename: null, EncodedFilename: null, Zbinkey: null, Zfileseq },
                  Keys: { AppnoName: 'Appno1', Gjahr, Pernr, Zseqnr, Werks, Mdate },
                },
                // 통합리포트
                Attachment2: {
                  Visible: {
                    Upload: Number(o.Appno2) === 0 && o.FileupChk === 'X' && o.Zstat !== '2',
                    Download: Number(o.Appno2) > 0,
                    DownloadFlag: Number(o.Appno2) > 0 ? 'O' : '', // 엑셀 다운로드용
                    Remove: Number(o.Appno2) > 0 && o.FileupChk === 'X' && o.Zstat !== '2',
                  },
                  Request: { ServiceUrl, UploadUrl, FileTypes, CsrfToken: null, Appno: o.Appno2, Zworktyp, Zfilename: null, EncodedFilename: null, Zbinkey: null, Zfileseq },
                  Keys: { AppnoName: 'Appno2', Gjahr, Pernr, Zseqnr, Werks, Mdate },
                },
              })
              .value();
          });
          const mEmployeeCount = _.chain(aEmployeeList)
            .map('Zstat')
            .countBy()
            .defaults({ ['0']: 0, ['1']: 0, ['2']: 0 })
            .value();
          const sInfoMessage = this.getBundleText('MSG_43002', mPayload.Ztitle); // {0} 대상자 입니다. : 조회 조건에 따른 대상자입니다.
          this.oPopoverModel.setProperty('/employee/listInfo', {
            list: aEmployeeList,
            rowCount: Math.min(Math.max(aEmployeeList.length, 1), 10),
            totalCount: aEmployeeList.length,
            readyCount: mEmployeeCount['0'],
            progressCount: mEmployeeCount['1'],
            completeCount: mEmployeeCount['2'],
            infoMessage: sInfoMessage,
          });
        } catch (oError) {
          this.debug('Controller > mobile talentDev > EmployeePopoverHandler > retrieve Error', oError);

          this.oPopoverModel.setProperty('/employee/listInfo', {
            list: [],
            rowCount: 1,
            totalCount: 0,
            readyCount: 0,
            progressCount: 0,
            completeCount: 0,
            infoMessage: this.getBundleText('MSG_43001'), // 조회 조건에 따른 대상자입니다.
          });

          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      getFileConfig() {
        return { ...this.oPopoverModel.getProperty('/fileConfig') };
      },

      onPressEmployeeListItem(oEvent) {
        this.setBusy();

        const { Pernr, Gjahr, Mdate, Zseqnr, FileupChk } = oEvent.getSource().getBindingContext().getProperty();

        setTimeout(async () => {
          const [{ Pturl, Dat01, Dat02, Dat03, Dat04, Dat08 }] = await Client.getEntitySet(this.oController.getModel(ServiceNames.PA), 'EmpProfileHeaderNew', { Pernr, Mobile: 'X' });
          const mHeaderData = {
            profilePath: _.isEmpty(Pturl) ? this.getUnknownAvatarImageURL() : Pturl,
            name: Dat01,
            chief: _.isEqual(Dat08, 'X'),
            baseInfo: [
              { data: Dat02, labelOrText: 'text' },
              { data: Dat03, labelOrText: 'text' },
              { data: Dat04, labelOrText: 'text' },
            ],
          };
          const AuthChange = this.oPopoverModel.getProperty('/employee/auth/AuthChange');

          this.oMobileTalentDevPopoverHandler.openPopover(mHeaderData, { Pernr, Gjahr, Mdate, Zseqnr, FileupChk, AuthChange });

          setTimeout(() => this.setBusy(false), 300);
        });
      },

      /**
       * 설정에 없는 파일 확장자가 선택된 경우 발생하는 event
       *
       * @param {*} oEvent
       */
      onTypeMissmatch(oEvent) {
        const sSupportedFileTypes = (oEvent.getSource().getFileType() || []).join(', ');
        MessageBox.alert(this.getBundleText('MSG_43004', oEvent.getParameter('fileType'), sSupportedFileTypes)); // 선택된 파일은 업로드가 불가한 확장자({0})를 가지고 있습니다.\n\n업로드 가능 확장자 :\n{1}
      },

      /**
       * FileUploader 파일 선택시 발생하는 event
       *
       * @param {*} oEvent
       */
      async onUploaderChange(oEvent) {
        this.setBusy();

        const bSuccess = await this.uploadFile(oEvent);
        if (!bSuccess) {
          this.setBusy(false);
        }
      },

      async uploadFile(oEvent) {
        const [mSelectedFile] = oEvent.getParameter('files'); // FileList object(Array가 아님)
        if (!mSelectedFile) {
          return false;
        }

        const oFileUploader = oEvent.getSource();
        const mRequest = oFileUploader.getBindingContext().getProperty('Request');

        if (!Number(mRequest.Appno)) {
          try {
            const [{ Appno }] = await Client.getEntitySet(this.oController.getModel(ServiceNames.TALENT), 'CreateTalentNo');

            mRequest.Appno = Appno;
          } catch (oError) {
            this.debug('Controller > mobile talentDev > EmployeePopoverHandler > uploadFile > CreateTalentNo Error', oError);

            if (oError instanceof UI5Error) {
              oError.code = oError.LEVEL.INFORMATION;
            }
            AppUtils.handleError(oError);

            return false;
          }
        }

        mRequest.CsrfToken = await this.getCsrfToken(mRequest.ServiceUrl);
        mRequest.EncodedFilename = encodeURIComponent(mSelectedFile.name);
        mRequest.Zfilename = mSelectedFile.name;
        mRequest.Type = mSelectedFile.type;
        mRequest.Zbinkey = String(parseInt(Math.random() * 100000000000000));

        oFileUploader.getModel().refresh();
        oFileUploader.upload();

        return true;
      },

      async getCsrfToken(sServiceUrl) {
        const oUploadModel = new ODataModel(sServiceUrl, { json: true, loadMetadataAsync: true, refreshAfterChange: false });
        oUploadModel.refreshSecurityToken();

        return oUploadModel._createRequest().headers['x-csrf-token'];
      },

      /**
       * Upload 완료 후 발생하는 event, upload 실패시에도 발생
       *
       * @param {*} oEvent
       */
      async onUploadComplete(oEvent) {
        await this.updateFileData(oEvent, () => {
          this.retrieve('2');
        });
      },

      async updateFileData(oEvent, fnCallback) {
        const sResponseRaw = oEvent.getParameter('responseRaw');
        if (!sResponseRaw) {
          MessageBox.alert(this.getBundleText('MSG_00041')); // 파일 업로드를 실패하였습니다.
          return;
        }

        const iStatusCode = oEvent.getParameter('status');
        if (iStatusCode !== 200 && iStatusCode !== 201) {
          try {
            const aMessages = [this.getBundleText('MSG_00041')]; // 파일 업로드를 실패하였습니다.
            const sResponseHtmlPreTag = $.parseHTML(sResponseRaw).filter((ele) => ele.nodeName === 'PRE');
            if (sResponseHtmlPreTag.length) {
              aMessages.push(sResponseHtmlPreTag[0].textContent.split(/at/)[0].trim());
            }
            MessageBox.alert(aMessages.join('\n\n'));
          } catch (oError) {
            this.debug('Controller > mobile talentDev > EmployeePopoverHandler > updateFileData Error', oError);

            if (oError instanceof UI5Error) {
              oError.code = oError.LEVEL.INFORMATION;
            }
            AppUtils.handleError(oError);
          }
          return;
        }
        // try {
        //   const mResponse = JSON.parse(sResponseRaw);
        //   if (mResponse.EError) {
        //     MessageBox.alert(mResponse.EError);
        //     return;
        //   }
        // } catch (oError) {
        //   if (oError instanceof UI5Error) {
        //     oError.code = oError.LEVEL.INFORMATION;
        //   }
        //   AppUtils.handleError(oError);
        //   return;
        // }

        try {
          const { Request, Keys } = oEvent.getSource().getBindingContext().getProperty();
          const { AppnoName, Gjahr, Pernr, Zseqnr, Werks, Mdate } = Keys;

          await Client.create(this.oController.getModel(ServiceNames.TALENT), 'TalentDevDetail', { Mode: 'U', Gjahr, Pernr, Zseqnr, Werks, Mdate, [AppnoName]: Request.Appno });

          // {업로드}되었습니다.
          MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00243'), {
            onClose: () => {
              fnCallback(Request.Appno);
            },
          });
        } catch (oError) {
          this.debug('Controller > mobile talentDev > EmployeePopoverHandler > updateFileData Error', oError);

          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
        }
      },

      async onPressFileDownload(oEvent) {
        const { Appno, Zworktyp } = oEvent.getSource().getBindingContext().getProperty('Request');
        const mFile = await FileDataProvider.readData(Appno, Zworktyp);

        this.AttachFileAction.openFileLink(mFile.Fileuri);
      },

      async onPressFileRemove(oEvent) {
        this.setBusy();

        await this.removeFile(oEvent, () => {
          this.retrieve('2');
        });
      },

      async removeFile(oEvent, fnCallback) {
        const { Request, Keys } = oEvent.getSource().getBindingContext().getProperty();
        const { Appno, Zworktyp, Zfileseq } = Request;
        const { AppnoName, Gjahr, Pernr, Zseqnr, Werks, Mdate } = Keys;
        const sMessageCode = 'LABEL_00110'; // 삭제

        const bGoOn = await new Promise((resolve) => {
          const sYes = this.getBundleText(sMessageCode);

          // {삭제}하시겠습니까?
          MessageBox.confirm(this.getBundleText('MSG_00006', sMessageCode), {
            actions: [
              this.getBundleText('LABEL_00118'), // 취소
              sYes,
            ],
            onClose: (sAction) => {
              resolve(sAction === sYes);
            },
          });
        });

        if (!bGoOn) {
          return;
        }

        try {
          // 컨텐츠 서버 파일 삭제
          await Client.remove(this.oController.getModel(ServiceNames.COMMON), 'FileList', { Appno, Zworktyp, Zfileseq });
        } catch (oError) {
          this.debug('Controller > mobile talentDev > EmployeePopoverHandler > onPressFileRemove FileListSet Error', oError);

          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
          return;
        }

        try {
          // 파일 정보 삭제
          await Client.create(this.oController.getModel(ServiceNames.TALENT), 'TalentDevDetail', { Mode: 'D', Gjahr, Pernr, Zseqnr, Werks, Mdate, [AppnoName]: Appno });

          // {삭제}되었습니다.
          MessageBox.alert(this.getBundleText('MSG_00007', sMessageCode), {
            onClose: fnCallback,
          });
        } catch (oError) {
          this.debug('Controller > mobile talentDev > EmployeePopoverHandler > onPressFileRemove TalentDevDetailSet Error', oError);

          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
        }
      },

      onPressPopoverClose() {
        this.oPopover.close();
      },

      async onPressLegend(oEvent) {
        this.oController.onPressLegend(oEvent);
      },

      setBusy(bBusy = true) {
        setTimeout(() => this.oPopoverModel.setProperty('/busy/Employee', bBusy));
        return this;
      },

      getBundleText(...aArgs) {
        return this.oController.getBundleText(...aArgs);
      },
    });
  }
);
