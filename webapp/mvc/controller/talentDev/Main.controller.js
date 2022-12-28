/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/export/library',
    'sap/ui/model/odata/ODataModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/FileDataProvider',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceManager',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/talentDev/TalentDevDialogHandler',
  ],
  (
    // prettier 방지용 주석
    exportLibrary,
    ODataModel,
    AppUtils,
    FileDataProvider,
    UI5Error,
    Client,
    ServiceManager,
    ServiceNames,
    MessageBox,
    BaseController,
    TalentDevDialogHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.talentDev.Main', {
      mSelectedCommitteeData: null,
      sFileWorkType: '9050',

      initializeModel() {
        const ServiceUrl = ServiceManager.getServiceUrl(ServiceNames.COMMON);
        return {
          busy: {
            Werks: false,
            Orgeh: false,
            Pernr: false,
            Gjahr: false,
            Zseqnr: false,
            Button: false,
            Committee: false,
            Employee: false,
          },
          entry: {
            Werks: [],
            Orgeh: [],
            Gjahr: [],
            Zseqnr: [],
          },
          searchConditions: {
            Werks: '',
            Orgeh: '',
            Pernr: '',
            Ename: '',
            Gjahr: '',
            Zseqnr: '',
          },
          committee: {
            listInfo: {
              list: [],
              rowCount: 1,
              totalCount: 0,
              readyCount: 0,
              progressCount: 0,
              completeCount: 0,
            },
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

      async onObjectMatched() {
        this.setContentsBusy(true);

        try {
          const oViewModel = this.getViewModel();
          oViewModel.setSizeLimit(10000);

          this.oTalentDevDialogHandler = new TalentDevDialogHandler(this);

          await this.initializeSearchConditions();

          this.retrieve('1', true);
        } catch (oError) {
          this.debug('Controller > talentDev > onObjectMatched Error', oError);

          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false);
        }
      },

      async initializeSearchConditions(sWerks) {
        const oViewModel = this.getViewModel();

        try {
          const oCommonModel = this.getModel(ServiceNames.COMMON);
          const oTalentModel = this.getModel(ServiceNames.TALENT);
          const { Pernr, Werks, Orgeh } = this.getAppointeeData();
          const sParamWerks = sWerks || Werks;
          const sGjahr = moment().format('YYYY');
          const [aPersaEntry, aOrgehEntry, aGjahrEntry, aZseqnrEntry, [mAuth]] = await Promise.all([
            Client.getEntitySet(oCommonModel, 'WerksList', { Pernr }), //
            Client.getEntitySet(oCommonModel, 'DashboardOrgList', { Werks: sParamWerks }),
            Client.getEntitySet(oTalentModel, 'GetGjahrList', { Werks: sParamWerks }),
            Client.getEntitySet(oTalentModel, 'GetZseqnrList', { Werks: sParamWerks, Gjahr: sGjahr }),
            Client.getEntitySet(oTalentModel, 'TalentDevAuth'),
          ]);

          oViewModel.setProperty('/employee/auth', _.chain(mAuth).omit('__metadata').value());
          oViewModel.setProperty('/searchConditions', {
            Werks: sParamWerks,
            // Orgeh: _.some(aOrgehEntry, (o) => o.Orgeh === Orgeh) ? Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']),
            Orgeh: 'ALL',
            Pernr: '',
            Ename: '',
            Gjahr: sGjahr,
            Zseqnr: _.get(aZseqnrEntry, [0, 'Zseqnr']),
          });

          const sChoiceText = AppUtils.getBundleText('LABEL_00268');
          aOrgehEntry.unshift({ Orgeh: 'ALL', Orgtx: sChoiceText });
          aGjahrEntry.unshift({ Gjahr: 'ALL', Gjahrtx: sChoiceText });
          aZseqnrEntry.unshift({ Zseqnr: 'ALL', Zseqnrtx: sChoiceText });

          this.setComboEntry(oViewModel, '/entry/Werks', aPersaEntry);
          this.setComboEntry(oViewModel, '/entry/Orgeh', aOrgehEntry);
          this.setComboEntry(oViewModel, '/entry/Gjahr', aGjahrEntry);
          this.setComboEntry(oViewModel, '/entry/Zseqnr', aZseqnrEntry);

          const mInitData = {
            list: [],
            rowCount: 1,
            totalCount: 0,
            readyCount: 0,
            progressCount: 0,
            completeCount: 0,
          };
          oViewModel.setProperty('/committee/listInfo', mInitData);
          oViewModel.setProperty('/employee/listInfo', { ...mInitData, infoMessage: '' });
        } catch (oError) {
          this.debug('Controller > talentDev > initializeSearchConditions Error', oError);

          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Orgeh', 'Gjahr', 'Zseqnr', 'Button']);
        }
      },

      setComboEntry(oViewModel, sPath, aEntry) {
        oViewModel.setProperty(
          sPath,
          _.map(aEntry, (o) => _.chain(o).omit('__metadata').value())
        );
      },

      // setContentsBusy(bContentsBusy = true, vTarget = []) {
      //   const oViewModel = this.getViewModel();
      //   const mBusy = oViewModel.getProperty('/busy');

      //   if (_.isEmpty(vTarget)) {
      //     _.forOwn(mBusy, (v, p) => _.set(mBusy, p, bContentsBusy));
      //   } else {
      //     if (_.isArray(vTarget)) {
      //       _.forEach(vTarget, (s) => _.set(mBusy, s, bContentsBusy));
      //     } else {
      //       _.set(mBusy, vTarget, bContentsBusy);
      //     }
      //   }

      //   oViewModel.refresh();
      // },

      /**
       * Mode 1 : 최초 조회 조건으로 인재육성위원회 및 대상자 테이블 모두 조회
       * Mode 2 : 인재육성위원회 행을 선택한 경우 해당 대상자 테이블 조회
       *
       * 팝업 데이터가 저장/완료된 경우 인재육성위원회 및 대상자 테이블 개별 갱신
       *   => 인재육성위원회 테이블의 선택된 행을 유지하면서 해당 대상자 테이블이 조회되어야하므로 개별 갱신함
       * Mode 11 : 인재육성위원회 테이블만 갱신
       * Mode 2 : 대상자 테이블만 갱신
       *
       * @param {string} sMode
       * @param {boolean} bOnloadSearch
       */
      async retrieve(sMode, bOnloadSearch = false) {
        const oViewModel = this.getViewModel();
        const mSearchConditions = this.getSearchConditions(oViewModel);
        const mPayload =
          sMode === '2'
            ? _.isEmpty(this.mSelectedCommitteeData)
              ? { ...mSearchConditions, Mode: '1' }
              : { ...this.mSelectedCommitteeData, Pernr: mSearchConditions.Pernr, Mode: sMode }
            : { ...mSearchConditions, Mode: sMode.charAt(0) };

        try {
          if (sMode === '1') {
            this.mSelectedCommitteeData = null;
            this.byId('committeeTable').clearSelection();
            this.byId('employeeTable').clearSelection();
          } else if (sMode === '2') {
            this.byId('employeeTable').clearSelection();
          }
          if (sMode === '1') {
            mPayload.TalentDevCommitteeSet = [];
            mPayload.TalentDevTargetSet = [];
          } else if (sMode === '11') {
            mPayload.TalentDevCommitteeSet = [];
          } else if (sMode === '2') {
            mPayload.TalentDevTargetSet = [];
          }

          const aData = await Client.deep(this.getModel(ServiceNames.TALENT), 'TalentDev', { ...mPayload });

          if (sMode === '1' || sMode === '11') {
            const aCommitteeList = _.map(aData.TalentDevCommitteeSet.results, (o) =>
              _.chain(o)
                .omit('__metadata')
                .update('Zstat', (sZstat) => (_.chain(sZstat).parseInt().isNaN().value() ? '0' : sZstat))
                .value()
            );
            const mCommitteeCount = _.chain(aCommitteeList)
              .map('Zstat')
              .countBy()
              .defaults({ ['0']: 0, ['1']: 0, ['2']: 0 })
              .value();
            oViewModel.setProperty('/committee/listInfo', {
              list: aCommitteeList,
              rowCount: Math.min(Math.max(aCommitteeList.length, 1), 3),
              totalCount: aCommitteeList.length,
              readyCount: mCommitteeCount['0'],
              progressCount: mCommitteeCount['1'],
              completeCount: mCommitteeCount['2'],
            });
          }

          if (sMode === '1' || sMode === '2') {
            const { ServiceUrl, UploadUrl, FileTypes, Zworktyp, Zfileseq } = this.getFileConfig(oViewModel);
            const aEmployeeList = _.map(aData.TalentDevTargetSet.results, (o) => {
              const { Gjahr, Pernr, Zseqnr, Werks, Mdate } = o;
              return _.chain(o)
                .omit('__metadata')
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
            const sInfoMessage = sMode === '2' && mPayload.Ztitle ? this.getBundleText('MSG_43002', mPayload.Ztitle) : this.getBundleText('MSG_43001'); // {0} 대상자 입니다. : 조회 조건에 따른 대상자입니다.
            oViewModel.setProperty('/employee/listInfo', {
              list: aEmployeeList,
              rowCount: Math.min(Math.max(aEmployeeList.length, 1), 10),
              totalCount: aEmployeeList.length,
              readyCount: mEmployeeCount['0'],
              progressCount: mEmployeeCount['1'],
              completeCount: mEmployeeCount['2'],
              infoMessage: sInfoMessage,
            });
          }
        } catch (oError) {
          this.debug('Controller > talentDev > retrieve Error', oError);

          const mInitData = {
            list: [],
            rowCount: 1,
            totalCount: 0,
            readyCount: 0,
            progressCount: 0,
            completeCount: 0,
          };
          oViewModel.setProperty('/committee/listInfo', mInitData);
          oViewModel.setProperty('/employee/listInfo', { ...mInitData, infoMessage: this.getBundleText('MSG_43001') }); // 조회 조건에 따른 대상자입니다.

          if (bOnloadSearch && oError.code === 'A') {
            return;
          }
          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Button', 'Committee', 'Employee']);
        }
      },

      getSearchConditions(oViewModel) {
        return _.chain(oViewModel.getProperty('/searchConditions'))
          .cloneDeep()
          .update('Orgeh', (sOrgeh) => (sOrgeh === 'ALL' ? '' : sOrgeh))
          .update('Gjahr', (sGjahr) => (sGjahr === 'ALL' ? '' : sGjahr))
          .update('Zseqnr', (sZseqnr) => (sZseqnr === 'ALL' ? '' : sZseqnr))
          .value();
      },

      getFileConfig(oViewModel) {
        return { ...oViewModel.getProperty('/fileConfig') };
      },

      onChangeWerks() {
        this.setContentsBusy(true, ['Orgeh', 'Gjahr', 'Zseqnr', 'Button']);

        const oViewModel = this.getViewModel();
        const sWerks = oViewModel.getProperty('/searchConditions/Werks');

        this.initializeSearchConditions(sWerks);
      },

      async onChangeGjahr() {
        this.setContentsBusy(true, ['Zseqnr', 'Button']);

        try {
          const oViewModel = this.getViewModel();
          const { Werks, Gjahr } = this.getSearchConditions(oViewModel);

          const aZseqnrEntry = await Client.getEntitySet(this.getModel(ServiceNames.TALENT), 'GetZseqnrList', { Werks, Gjahr });

          oViewModel.setProperty('/searchConditions/Zseqnr', 'ALL');
          aZseqnrEntry.unshift({ Zseqnr: 'ALL', Zseqnrtx: this.getBundleText('LABEL_00268') });
          this.setComboEntry(oViewModel, '/entry/Zseqnr', aZseqnrEntry);
        } catch (oError) {
          this.debug('Controller > talentDev > onChangeGjahr Error', oError);

          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Zseqnr', 'Button']);
        }
      },

      onEmployeeSearchOpen() {
        this.getEmployeeSearchDialogHandler()
          .setOnLoadSearch(this.getEmployeeSearchDialogOnLoadSearch()) // Open 후 조회 여부 - 각 화면에서 구현
          .setOptions(this.getEmployeeSearchDialogCustomOptions()) // Fields 활성화여부 및 초기 선택값 - 각 화면에서 구현
          .setCallback(this.callbackAppointeeChange.bind(this)) // 선택 후 실행 할 Function - 각 화면에서 구현
          .openDialog();
      },

      getEmployeeSearchDialogOnLoadSearch() {
        return true;
      },

      getEmployeeSearchDialogCustomOptions() {
        const oViewModel = this.getViewModel();
        const { Werks, Orgeh } = this.getSearchConditions(oViewModel);
        const aOrgehEntry = oViewModel.getProperty('/entry/Orgeh');
        return {
          searchConditions: {
            Persa: Werks.replace(/0000/, ''),
            Orgeh,
            Orgtx: _.find(aOrgehEntry, { Orgeh }).Orgtx,
          },
        };
      },

      callbackAppointeeChange({ Pernr, Ename }) {
        const oViewModel = this.getViewModel();
        oViewModel.setProperty('/searchConditions/Pernr', Pernr);
        oViewModel.setProperty('/searchConditions/Ename', Ename);
      },

      onPressSearch() {
        this.setContentsBusy(true, ['Button', 'Committee', 'Employee']);
        this.bSearchButtonClick = true;

        this.retrieve('1');
      },

      onPressCommitteeExcelDownload() {
        this.setContentsBusy(true, 'Button');
        const oTable = this.byId('committeeTable');
        const sFileName = this.getBundleText('LABEL_43001'); // 인재육성위원회

        this.TableUtils.export({ oTable, sFileName });
        this.setContentsBusy(false, 'Button');
      },

      onPressEmployeeExcelDownload() {
        this.setContentsBusy(true, 'Button');

        const oTable = this.byId('employeeTable');
        const sFileName = `${this.getBundleText('LABEL_43001')}_${this.getBundleText('LABEL_43002')}`; // 인재육성위원회_대상자
        const aCustomColumns = [
          { type: exportLibrary.EdmType.String, label: this.getBundleText('LABEL_00237'), property: 'Name1' }, // 인사영역
          { type: exportLibrary.EdmType.String, label: this.getBundleText('LABEL_00224'), property: 'Orgtx' }, // 부서
          { type: exportLibrary.EdmType.String, label: this.getBundleText('LABEL_43002'), property: 'Target' }, // 대상자
          { type: exportLibrary.EdmType.String, label: this.getBundleText('LABEL_43003'), property: 'Gjahr' }, // 대상년도
          { type: exportLibrary.EdmType.String, label: this.getBundleText('LABEL_43004'), property: 'Zseqnrtx' }, // 차수
          { type: exportLibrary.EdmType.String, label: this.getBundleText('LABEL_43009'), property: 'Zstattx' }, // 진행상태
          { type: exportLibrary.EdmType.String, label: this.getBundleText('LABEL_43011'), property: 'Attachment2/Visible/DownloadFlag' }, // 통합리포트
          { type: exportLibrary.EdmType.String, label: this.getBundleText('LABEL_43012'), property: 'DescFlag' }, // 논의사항
        ];

        if (this.getViewModel().getProperty('/employee/auth/AuthFiles') === 'X') {
          aCustomColumns.splice(7, 0, { type: exportLibrary.EdmType.String, label: this.getBundleText('LABEL_43010'), property: 'Attachment1/Visible/DownloadFlag' }); // 심리분석보고서
        }

        this.TableUtils.export({ oTable, sFileName, aCustomColumns });
        this.setContentsBusy(false, 'Button');
      },

      onSelectCommitteeTableRow(oEvent) {
        const oTable = oEvent.getSource();
        const iRowIndex = oEvent.getParameter('rowIndex');
        setTimeout(() => {
          if (!oTable.getSelectedIndices().length) {
            oTable.setSelectedIndex(iRowIndex);
          }
        }, 100);

        this.setContentsBusy(true, ['Button', 'Committee', 'Employee']);

        this.mSelectedCommitteeData = oEvent.getParameter('rowBindingContext').getProperty();
        this.retrieve('2');
      },

      onSelectEmployeeTableRow(oEvent) {
        const oCellControl = oEvent.getParameter('cellControl');
        if (oCellControl.isA('sap.m.HBox') && oCellControl.hasStyleClass('file-updown-icon-group')) {
          return;
        }

        const { Pernr, Gjahr, Mdate, Zseqnr, FileupChk } = oEvent.getParameter('rowBindingContext').getProperty();

        setTimeout(() => {
          const AuthChange = this.getViewModel().getProperty('/employee/auth/AuthChange');
          this.oTalentDevDialogHandler //
            .setCallback(() => {
              this.retrieve('11'); // 인재육성위원회 테이블만 갱신
              this.retrieve('2'); // 대상자 테이블만 갱신
            })
            .openDialog({ Pernr, Gjahr, Mdate, Zseqnr, FileupChk, AuthChange });
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
        this.setContentsBusy(true, ['Button', 'Committee', 'Employee']);

        const bSuccess = await this.uploadFile(oEvent);
        if (!bSuccess) {
          this.setContentsBusy(false, ['Button', 'Committee', 'Employee']);
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
            const [{ Appno }] = await Client.getEntitySet(this.getModel(ServiceNames.TALENT), 'CreateTalentNo');

            mRequest.Appno = Appno;
          } catch (oError) {
            this.debug('Controller > talentDev > uploadFile > CreateTalentNo Error', oError);

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
            this.debug('Controller > talentDev > updateFileData Error', oError);

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

          await Client.create(this.getModel(ServiceNames.TALENT), 'TalentDevDetail', { Mode: 'U', Gjahr, Pernr, Zseqnr, Werks, Mdate, [AppnoName]: Request.Appno });

          // {업로드}되었습니다.
          MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00243'), {
            onClose: () => {
              fnCallback(Request.Appno);
            },
          });
        } catch (oError) {
          this.debug('Controller > talentDev > updateFileData Error', oError);

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
        this.setContentsBusy(true, ['Button', 'Committee', 'Employee']);

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
              sYes,
              this.getBundleText('LABEL_00118'), // 취소
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
          await Client.remove(this.getModel(ServiceNames.COMMON), 'FileList', { Appno, Zworktyp, Zfileseq });
        } catch (oError) {
          this.debug('Controller > talentDev > onPressFileRemove FileListSet Error', oError);

          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
          return;
        }

        try {
          // 파일 정보 삭제
          await Client.create(this.getModel(ServiceNames.TALENT), 'TalentDevDetail', { Mode: 'D', Gjahr, Pernr, Zseqnr, Werks, Mdate, [AppnoName]: Appno });

          // {삭제}되었습니다.
          MessageBox.alert(this.getBundleText('MSG_00007', sMessageCode), {
            onClose: fnCallback,
          });
        } catch (oError) {
          this.debug('Controller > talentDev > onPressFileRemove TalentDevDetailSet Error', oError);

          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
        }
      },

      rowHighlight(sValue) {
        const vValue = !parseInt(sValue, 10) ? sValue : parseInt(sValue, 10);

        switch (vValue) {
          case 1:
            return sap.ui.core.IndicationColor.Indication03;
          case 2:
            return sap.ui.core.IndicationColor.Indication05;
          default:
            return sap.ui.core.IndicationColor.None;
        }
      },
    });
  }
);
