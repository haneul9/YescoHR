sap.ui.define(
    [
      // prettier 방지용 주석
      'sap/ui/core/Fragment',
      'sap/ui/yesco/control/MessageBox',
      'sap/ui/yesco/common/odata/Client',
      'sap/ui/yesco/common/exceptions/UI5Error',
      'sap/ui/yesco/common/Appno',
      'sap/ui/yesco/common/AppUtils',
      'sap/ui/yesco/common/odata/ServiceNames',
      'sap/ui/yesco/mvc/controller/BaseController',
    ],
    function (
      // prettier 방지용 주석
      Fragment,
      MessageBox,
      Client,
      UI5Error,
      Appno,
      AppUtils,
      ServiceNames,
      BaseController
    ) {
      'use strict';
  
      return BaseController.extend('sap.ui.yesco.mvc.controller.holidayWork.mobile.Detail', {
        APPTP: 'HR17',
  
        getPreviousRouteName() {
          return this.getViewModel().getProperty('/previousName');
        },
  
        getCurrentLocationText(oArguments) {
          const sAction = oArguments.appno === 'n' ? this.getBundleText('LABEL_41012') : this.getBundleText('LABEL_41013'); // 휴일근무 신규신청, 휴일근무 조회
  
          return sAction;
        },
  
        initializeModel() {
          return {
            busy: false,
            previousName: '',
            Appno: null,
            ZappStatAl: null,
            form: {
              hasRow: false,
              rowCount: 1,
              listMode: 'None',
              list: [],
            },
            dialog: {
              busy: false,
              isActiveSave: false,
              initBeguz: moment('0900', 'hhmm').toDate(),
              initEnduz: moment('1800', 'hhmm').toDate(),
              employees: [],
              enableSubty: false,
              subtyEntry: [
                { visible: '', Zcode: '2230', Ztext: this.getBundleText('LABEL_41004') }, // 휴일대체
                { visible: '', Zcode: '2231', Ztext: this.getBundleText('LABEL_41008') }, // 휴일대체(오전)
                { visible: '', Zcode: '2232', Ztext: this.getBundleText('LABEL_41009') }, // 휴일대체(오후)
              ],
              grid: {},
              listMode: 'None',
              list: [],
              rowCount: 1,
            },
            ApplyInfo: {},
            ApprovalDetails: {},
          };
        },
  
        async onObjectMatched(oParameter, sRouteName) {
          const oViewModel = this.getView().getModel();
  
          oViewModel.setSizeLimit(10000);
          oViewModel.setData(this.initializeModel());
          oViewModel.setProperty('/Appno', oParameter.appno === 'n' ? null : oParameter.appno);
          oViewModel.setProperty('/previousName', _.chain(sRouteName).split('-', 1).head().value());
          oViewModel.setProperty('/list', [{Pernr: this.getAppointeeProperty('Pernr')}]);
  
          this.loadPage();
        },
  
        async loadPage() {
          const oView = this.getView();
          const oViewModel = oView.getModel();
          const sAppno = oViewModel.getProperty('/Appno');
  
          oViewModel.setProperty('/busy', true);
  
          try {
            if (sAppno) {
              const oModel = this.getModel(ServiceNames.WORKTIME);
              const aSubtyEntry = oViewModel.getProperty('/dialog/subtyEntry');
              const aDetailData = await Client.getEntitySet(oModel, 'OtWorkApply2', { Appno: sAppno });
              const mDetail = aDetailData[0] ?? {};
  
              oViewModel.setProperty('/ZappStatAl', mDetail.ZappStatAl);
              oViewModel.setProperty('/form/listMode', mDetail.ZappStatAl ? 'MultiSelect' : 'None');
  
              const aData = _.map(aDetailData, (o) => {
                return _.set(o, 'Subtytx', _.chain(aSubtyEntry).find({ Zcode: o.Subty }).get('Ztext').value());
              });

              oViewModel.setProperty('/dialog/grid', aData[0]);

              this.initializeApplyInfoBox(mDetail);
              this.initializeApprovalBox(mDetail);
            } else {
              oViewModel.setProperty('/form/listMode', 'MultiSelect');
              this.initializeApplyInfoBox();
            }
  
            // this.initializeAttachBox();
          } catch (oError) {
            this.debug('Controller > holidayWork Detail > loadPage Error', oError);
  
            if (oError instanceof Error) oError = new UI5Error({ message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.
  
            AppUtils.handleError(oError, {
              onClose: () => this.getRouter().navTo(oViewModel.getProperty('/previousName')),
            });
          } finally {
            oViewModel.setProperty('/busy', false);
          }
        },
  
        setTableData({ oViewModel, aRowData }) {
          oViewModel.setProperty('/form/rowCount', aRowData.length || 1);
          oViewModel.setProperty('/form/list', aRowData);
  
          this.toggleHasRowProperty();
        },
  
        toggleHasRowProperty() {
          const oViewModel = this.getViewModel();
          const aTableData = oViewModel.getProperty('/form/list');
  
          oViewModel.setProperty('/form/hasRow', !!aTableData.length);
        },
  
        initializeApplyInfoBox(detailData) {
          const oViewModel = this.getViewModel();
  
          if (_.isEmpty(detailData)) {
            const mSessionData = this.getAppointeeData();
  
            oViewModel.setProperty('/ApplyInfo', {
              Apename: mSessionData.Ename,
              Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
              Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
            });
          } else {
            oViewModel.setProperty('/ApplyInfo', { ...detailData });
          }
        },
  
        initializeApprovalBox(detailData) {
          const oViewModel = this.getViewModel();
  
          oViewModel.setProperty('/ApprovalDetails', { ...detailData });
        },
  
        initializeAttachBox() {
          const oViewModel = this.getViewModel();
          const sStatus = oViewModel.getProperty('/ZappStatAl');
          const sAppno = oViewModel.getProperty('/Appno') || '';
  
          this.AttachFileAction.setAttachFile(this, {
            Editable: !sStatus,
            Type: this.APPTP,
            Appno: sAppno,
            Max: 10,
          });
        },
  
        async openFormDialog() {
          const oView = this.getView();
          const oViewModel = this.getViewModel();
  
          if (!this.pHolidayWorkTimeDialog) {
            this.pHolidayWorkTimeDialog = await Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.holidayWork.fragment.HolidayWorkTimeDialog',
              controller: this,
            });
  
            this.pHolidayWorkTimeDialog.attachBeforeOpen(async () => {
              oViewModel.setProperty('/dialog/grid', { Datum: moment().hours(9).toDate() });
  
              this.retrieveTargetEmployee();
            });
  
            oView.addDependent(this.pHolidayWorkTimeDialog);
          }
  
          this.pHolidayWorkTimeDialog.open();
        },
  
        async retrieveTargetEmployee() {
          const oViewModel = this.getViewModel();
  
          try {
            const aEmployees = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'OtpernrList', {
              Menid: this.getCurrentMenuId(),
              Datum: this.DateUtils.parse(oViewModel.getProperty('/dialog/grid/Datum')),
              Pernr: this.getAppointeeProperty('Pernr'),
            });
  
            oViewModel.setProperty(
              '/dialog/employees',
              aEmployees.map((o) => ({ ..._.pick(o, ['Ename', 'Orgtx', 'Zzjikgbt', 'Zzjikcht']), Pernr: _.trimStart(o.Pernr, '0') }))
            );
          } catch (oError) {
            this.debug('Controller > holidayWork Detail > retrieveTargetEmployee Error', oError);
  
            AppUtils.handleError(oError);
          }
        },
  
        async calcWorkTime() {
          const oViewModel = this.getViewModel();
  
          oViewModel.setProperty('/dialog/busy', true);
  
          try {
            const mInputData = this.TimeUtils.convert2400Time(_.cloneDeep(oViewModel.getProperty('/dialog/grid')));
  
            if (_.isEmpty(mInputData.Pdbeg) || _.isEmpty(mInputData.Pdend)) {
              delete mInputData.Pdbeg;
              delete mInputData.Pdend;
            }
  
            const mResultData = await Client.create(this.getModel(ServiceNames.WORKTIME), 'OtWorkApply2', {
              Pernr: this.getAppointeeProperty('Pernr'),
              Datum: this.DateUtils.parse(mInputData.Datum),
              ..._.chain(mInputData).pick(['Beguz', 'Enduz', 'Pdbeg', 'Pdend']).omitBy(_.isNil).value(),
            });
  
            oViewModel.setProperty('/dialog/grid/Abrst', mResultData.Abrst);
            oViewModel.setProperty('/dialog/grid/Brktm', mResultData.Brktm);
  
            const aSubtyEntry = oViewModel.getProperty('/dialog/subtyEntry');
            const iAbrst = _.toNumber(mResultData.Abrst);
  
            oViewModel.setProperty('/dialog/enableSubty', iAbrst > 0 && iAbrst <= 4);
            oViewModel.setProperty('/dialog/grid/Subty', iAbrst > 4 ? '2230' : null);
            oViewModel.setProperty(
              '/dialog/subtyEntry',
              _.map(aSubtyEntry, (o) => {
                o.visible = '';
  
                if (o.Zcode === '2230') {
                  if (iAbrst > 4) o.visible = 'X';
                } else {
                  if (iAbrst > 0 && iAbrst <= 4) o.visible = 'X';
                }
  
                return o;
              })
            );
  
            oViewModel.setProperty('/dialog/isActiveSave', true);
            oViewModel.refresh(true);
          } catch (oError) {
            this.debug('Controller > holidayWork Detail > calcWorkTime Error', oError);
  
            AppUtils.handleError(oError);
  
            oViewModel.setProperty('/dialog/grid/Abrst', null);
            oViewModel.setProperty('/dialog/grid/Brktm', null);
            oViewModel.setProperty('/dialog/grid/Subty', null);
            oViewModel.setProperty('/dialog/isActiveSave', false);
          } finally {
            oViewModel.setProperty('/dialog/busy', false);
          }
        },
  
        validExistRows() {
          const oViewModel = this.getViewModel();
          const aApprovalList = oViewModel.getProperty('/form/list');
          const aAddedList = oViewModel.getProperty('/dialog/list');
          const dDatum = oViewModel.getProperty('/dialog/grid/Datum');
  
          if (
            _.some(aAddedList, (o) => {
              return _.chain(aApprovalList)
                .filter((t) => _.isEqual(t.Pernr, o.Pernr) && moment(dDatum).isSame(moment(t.Datum), 'day'))
                .size()
                .gt(0)
                .value();
            })
          ) {
            MessageBox.alert(this.getBundleText('MSG_41001')); // 동일한 사번/일자 데이터가 존재하여 저장이 불가합니다.
            return true;
          }
  
          return false;
        },
  
        validRequiredInputData() {
          const oViewModel = this.getViewModel();
          const mInputData = oViewModel.getProperty('/dialog/grid');
          const aTargets = oViewModel.getProperty('/dialog/list');
  
          if (!mInputData.Datum) {
            MessageBox.alert(this.getBundleText('MSG_00002', 'LABEL_27004')); // {근무일}을 입력하세요.
            return true;
          }
  
          if (_.isEmpty(mInputData.Abrst)) {
            MessageBox.alert(this.getBundleText('MSG_00002', 'LABEL_27009')); // {근무시간}을 입력하세요.
            return true;
          }
  
          if (_.isEmpty(mInputData.Atrsn)) {
            MessageBox.alert(this.getBundleText('MSG_00003', 'LABEL_41006')); // {신청사유}를 입력하세요.
            return true;
          }
  
          if (_.isEmpty(mInputData.Subty)) {
            MessageBox.alert(this.getBundleText('MSG_00004', 'LABEL_41007')); // {휴일대체유형}을 선택하세요.
            return true;
          }
  
          if (!mInputData.Subda) {
            MessageBox.alert(this.getBundleText('MSG_00003', 'LABEL_41005')); // {휴일대체일}를 입력하세요.
            return true;
          }
  
          if (
            _.chain(aTargets)
              .filter((o) => !_.isEmpty(o.Pernr))
              .size()
              .isEqual(0)
              .value()
          ) {
            MessageBox.alert(this.getBundleText('MSG_41002')); // 대상자를 등록하세요.
            return true;
          }
  
          return false;
        },
  
        async createProcess() {
          const oViewModel = this.getViewModel();
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const aFormList = _.chain(oViewModel.getProperty('/form/list'))
            .cloneDeep()
            .map((o) => {
              delete o.Subtytx;
  
              return this.TimeUtils.convert2400Time(o);
            })
            .value();
  
          const mCheckResult = await Client.deep(oModel, 'OtWorkApply2', {
            Prcty: 'V',
            Menid: this.getCurrentMenuId(),
            ...aFormList[0],
            OtWorkNav2: aFormList,
          });
  
          if (_.isEmpty(mCheckResult.Retmsg)) {
            this.callCreateOdata();
          } else {
            MessageBox.confirm(_.replace(mCheckResult.Retmsg, '\\n', '\n'), {
              actions: [this.getBundleText('LABEL_00114'), MessageBox.Action.CANCEL],
              onClose: (sAction) => {
                if (!sAction || sAction === MessageBox.Action.CANCEL) {
                  AppUtils.setAppBusy(false);
                  return;
                }
  
                this.callCreateOdata();
              },
            });
          }
        },
  
        async callCreateOdata() {
          const oViewModel = this.getViewModel();
  
          try {
            // const iAttachLength = this.AttachFileAction.getFileCount.call(this);
            let sAppno = oViewModel.getProperty('/Appno');
  
            if (!sAppno) {
              sAppno = await Appno.get();
              oViewModel.setProperty('/Appno', sAppno);
            }
  
            // if (iAttachLength > 0) {
            //   await this.AttachFileAction.uploadFile.call(this, sAppno, this.APPTP);
            // }
  
            const aFormList = _.chain(oViewModel.getProperty('/form/list'))
              .cloneDeep()
              .map((o) => {
                delete o.Subtytx;
  
                return this.TimeUtils.convert2400Time(o);
              })
              .value();
  
            const mResults = await Client.deep(this.getModel(ServiceNames.WORKTIME), 'OtWorkApply2', {
              ...aFormList[0],
              Prcty: 'C',
              Appno: sAppno,
              Appda: moment().hours(9).toDate(),
              Menid: this.getCurrentMenuId(),
              OtWorkNav2: aFormList,
            });
  
            if (mResults.Zurl) window.open(mResults.Zurl, '_blank');
  
            // {신청}되었습니다.
            MessageBox.success(this.getBundleText('MSG_00007', this.getBundleText('LABEL_00121')), {
              onClose: () => {
                this.getRouter().navTo(oViewModel.getProperty('/previousName'));
              },
            });
          } catch (oError) {
            this.debug('Controller > holidayWork Detail > createProcess Error', oError);
  
            AppUtils.handleError(oError);
          } finally {
            AppUtils.setAppBusy(false);
          }
        },
  
        onPressApproval() {
          AppUtils.setAppBusy(true);
  
          // {신청}하시겠습니까?
          MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
            actions: [this.getBundleText('LABEL_00121'), MessageBox.Action.CANCEL],
            onClose: (sAction) => {
              if (!sAction || sAction === MessageBox.Action.CANCEL) {
                AppUtils.setAppBusy(false);
                return;
              }
  
              this.createProcess();
            },
          });
        },
  
        async onAddDetail() {
          this.openFormDialog();
        },
  
        onDelDetail() {
          const oViewModel = this.getViewModel();
          const oTable = this.byId('holidayWorkTable');
          const aTableData = oViewModel.getProperty('/form/list');
          const aSelectedIndices = oTable.getSelectedIndices();
  
          if (aSelectedIndices.length < 1) {
            MessageBox.alert(this.getBundleText('MSG_00055')); // 삭제할 데이터를 선택하세요.
            return;
          }
  
          // 선택된 행을 삭제하시겠습니까?
          MessageBox.confirm(this.getBundleText('MSG_00021'), {
            onClose: function (sAction) {
              if (MessageBox.Action.CANCEL === sAction) return;
  
              const aUnSelectedData = aTableData.filter((elem, idx) => {
                return !aSelectedIndices.some(function (iIndex) {
                  return iIndex === idx;
                });
              });
  
              this.setTableData({ oViewModel, aRowData: [...aUnSelectedData] });
  
              oTable.clearSelection();
            }.bind(this),
          });
        },
  
        onHolidayDialogAfterClose() {
          this.pHolidayWorkTimeDialog.destroy();
          this.pHolidayWorkTimeDialog = null;
        },
  
        onDialogSavBtn(oEvent) {
          if (this.validExistRows()) return;
  
          if (this.validRequiredInputData()) return;
  
          const oViewModel = this.getViewModel();
          const aFormList = oViewModel.getProperty('/form/list');
          const mDialogGrid = oViewModel.getProperty('/dialog/grid');
          const aTargets = oViewModel.getProperty('/dialog/list');
          const aSubtyEntry = oViewModel.getProperty('/dialog/subtyEntry');
  
          _.set(mDialogGrid, 'Subtytx', _.chain(aSubtyEntry).find({ Zcode: mDialogGrid.Subty }).get('Ztext').value());
  
          // this.setTableData({
          //   oViewModel,
          //   aRowData: [
          //     ...aFormList,
          //     ..._.chain(aTargets)
          //       .filter((o) => !_.isEmpty(o.Pernr))
          //       .uniqBy('Pernr')
          //       .map((o) => ({ ...o, ...mDialogGrid }))
          //       .value(),
          //   ],
          // });

          const aListData = oViewModel.getProperty('/form/list');

          aFormList.push({
            ...mDialogGrid,
            Datum: this.DateUtils.parse(mDialogGrid.Datum),
            Subda: this.DateUtils.parse(mDialogGrid.Subda),
            Pernr: aTargets[0].Pernr
          });

          oViewModel.setProperty('/form/list', aListData);
          oViewModel.setProperty('/dialog/grid', {});
  
          // oViewModel.setProperty('/dialog/isActiveSave', false);
          // oViewModel.setProperty('/dialog/list', []);
          // oViewModel.setProperty('/dialog/rowCount', 1);
  
          // this.onDialogClose(oEvent);
        },
  
        onWorkDatePicker() {
          // 대상자 목록 조회
          this.retrieveTargetEmployee();
  
          // 근태계산
          this.onChangeWorkTime();
        },
  
        onChangeWorkTime() {
          const oViewModel = this.getViewModel();
          const mInputData = oViewModel.getProperty('/dialog/grid');
  
          oViewModel.setProperty('/dialog/isActiveSave', false);
          oViewModel.setProperty('/dialog/grid/Abrst', null);
          oViewModel.setProperty('/dialog/grid/Brktm', null);
  
          if (_.isEmpty(mInputData.Datum)) return;
          if (_.isEmpty(mInputData.Beguz) || _.isEmpty(mInputData.Enduz)) return;
          if (_.isObject(mInputData.Beguz) && _.isObject(mInputData.Enduz) && mInputData.Beguz.ms >= mInputData.Enduz.ms) return;
  
          this.calcWorkTime();
        },
  
        onChangeBreakTime() {
          const oViewModel = this.getViewModel();
          const mInputData = oViewModel.getProperty('/dialog/grid');
  
          oViewModel.setProperty('/dialog/isActiveSave', false);
          oViewModel.setProperty('/dialog/grid/Brktm', null);
  
          if ((!_.isEmpty(mInputData.Pdbeg) && _.isEmpty(mInputData.Pdend)) || (_.isEmpty(mInputData.Pdbeg) && !_.isEmpty(mInputData.Pdend))) return;
          if (_.isObject(mInputData.Pdbeg) && _.isObject(mInputData.Pdend) && mInputData.Pdbeg.ms >= mInputData.Pdend.ms) return;
  
          this.calcWorkTime();
        },
  
        onDialogAdd() {
          const oViewModel = this.getViewModel();
          const aDialogTable = oViewModel.getProperty('/dialog/list');
  
          oViewModel.setProperty('/dialog/list', [
            ...aDialogTable,
            {
              Pernr: '',
              Ename: '',
              Zzjikgbt: '',
              Zzjikcht: '',
              Orgtx: '',
            },
          ]);
  
          const iLength = _.size(oViewModel.getProperty('/dialog/list'));
          oViewModel.setProperty('/dialog/rowCount', Math.min(iLength, 5));
        },
  
        onDialogDel() {
          const oViewModel = this.getViewModel();
          const oTable = this.byId('holidayWorkTargetsTable');
          const aTableData = oViewModel.getProperty('/dialog/list');
          const aSelectedIndices = oTable.getSelectedIndices();
  
          if (aSelectedIndices.length < 1) {
            MessageBox.alert(this.getBundleText('MSG_00055')); // 삭제할 데이터를 선택하세요.
            return;
          }
  
          // 선택된 행을 삭제하시겠습니까?
          MessageBox.confirm(this.getBundleText('MSG_00021'), {
            onClose: function (sAction) {
              if (MessageBox.Action.CANCEL === sAction) return;
  
              const aUnSelectedData = aTableData.filter((elem, idx) => {
                return !aSelectedIndices.some(function (iIndex) {
                  return iIndex === idx;
                });
              });
  
              oViewModel.setProperty('/dialog/list', aUnSelectedData);
              oViewModel.setProperty('/dialog/rowCount', Math.min(_.size(aUnSelectedData), 5));
  
              oTable.clearSelection();
            }.bind(this),
          });
        },
  
        onSelectSuggest(oEvent) {
          const oInput = oEvent.getSource();
          const oSelectedSuggestionRow = oEvent.getParameter('selectedRow');
  
          if (oSelectedSuggestionRow) {
            const oContext = oSelectedSuggestionRow.getBindingContext();
  
            oInput.setValue(oContext.getProperty('Pernr'));
  
            const sRowPath = oInput.getParent().getBindingContext().getPath();
            const oViewModel = this.getViewModel();
  
            oViewModel.setProperty(`${sRowPath}/Ename`, oContext.getProperty('Ename'));
            oViewModel.setProperty(`${sRowPath}/Orgtx`, oContext.getProperty('Orgtx'));
            oViewModel.setProperty(`${sRowPath}/Zzjikgbt`, oContext.getProperty('Zzjikgbt'));
            oViewModel.setProperty(`${sRowPath}/Zzjikcht`, oContext.getProperty('Zzjikcht'));
          }
  
          oInput.getBinding('suggestionRows').filter([]);
        },
  
        onSubmitSuggest(oEvent) {
          const oViewModel = this.getViewModel();
          const oInput = oEvent.getSource();
          const oContext = oInput.getParent().getBindingContext();
          const sRowPath = oContext.getPath();
          const sInputValue = oEvent.getParameter('value');
  
          if (!sInputValue) {
            oViewModel.setProperty(`${sRowPath}/Pernr`, '');
            oViewModel.setProperty(`${sRowPath}/Ename`, '');
            oViewModel.setProperty(`${sRowPath}/Zzjikgbt`, '');
            oViewModel.setProperty(`${sRowPath}/Zzjikcht`, '');
            oViewModel.setProperty(`${sRowPath}/Orgtx`, '');
  
            return;
          }
  
          const aEmployees = oViewModel.getProperty('/dialog/employees');
          const [mEmployee] = _.filter(aEmployees, (o) => _.startsWith(o.Pernr, sInputValue));
  
          if (sRowPath && !_.isEmpty(mEmployee)) {
            oViewModel.setProperty(`${sRowPath}/Pernr`, mEmployee.Pernr);
            oViewModel.setProperty(`${sRowPath}/Ename`, mEmployee.Ename);
            oViewModel.setProperty(`${sRowPath}/Zzjikgbt`, mEmployee.Zzjikgbt);
            oViewModel.setProperty(`${sRowPath}/Zzjikcht`, mEmployee.Zzjikcht);
            oViewModel.setProperty(`${sRowPath}/Orgtx`, mEmployee.Orgtx);
          } else {
            oViewModel.setProperty(`${sRowPath}/Pernr`, '');
            oViewModel.setProperty(`${sRowPath}/Ename`, '');
            oViewModel.setProperty(`${sRowPath}/Zzjikgbt`, '');
            oViewModel.setProperty(`${sRowPath}/Zzjikcht`, '');
            oViewModel.setProperty(`${sRowPath}/Orgtx`, '');
          }
        },

        onPressDelBtn() {
          const oViewModel = this.getViewModel();
          const oList = this.byId('DetailList').getSelectedContexts();
  
          if (_.isEmpty(oList)) {
            // 삭제할 데이터를 선택하세요.
            MessageBox.alert(this.getBundleText('MSG_00055'));
            return;
          }
  
          const aDelList = _.map(oList, (e) => oViewModel.getProperty(e.sPath));
  
          // 선택된 행을 삭제하시겠습니까?
          MessageBox.confirm(this.getBundleText('MSG_00021'), {
            onClose: (sAction) => {
              if (MessageBox.Action.CANCEL === sAction) return;
  
              const aDiffList = _.difference(oViewModel.getProperty('/form/list'), aDelList);
  
              oViewModel.setProperty('/form/list', aDiffList);
              oViewModel.setProperty('/form/rowCount', _.size(aDiffList));
              this.byId('DetailList').removeSelections(true);
  
              this.toggleHasRowProperty();
            },
          });
        },
      });
    }
  );
  