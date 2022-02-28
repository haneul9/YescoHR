/* eslint-disable no-else-return */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/DateUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/Validator',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    FilterOperator,
    JSONModel,
    MessageBox,
    ComboEntry,
    UI5Error,
    ODataReadError,
    ODataCreateError,
    Appno,
    AppUtils,
    DateUtils,
    AttachFileAction,
    ServiceNames,
    TableUtils,
    TextUtils,
    Validator,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.attendance.Detail', {
      LIST_PAGE_ID: 'container-ehr---attendanceList',
      APPTP: 'HR04',
      PAGE_TYPE: { NEW: 'A', CHANGE: 'B', CANCEL: 'C' },
      ACTION_MESSAGE: {
        T: 'LABEL_00104', // 임시저장
        C: 'LABEL_00121', // 신청
      },

      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,

      getPreviousRouteName() {
        return 'attendance';
      },

      initializeModel() {
        return {
          busy: false,
          type: this.PAGE_TYPE.NEW,
          Appno: null,
          ZappStatAl: null,
          form: {
            hasRow: false,
            rowCount: 1,
            listMode: 'MultiToggle',
            list: [],
            dialog: {
              calcCompleted: false,
              selectedRowPath: null,
              awartCodeList: new ComboEntry({ codeKey: 'Awart', valueKey: 'Atext' }),
              data: {
                Awart: 'ALL',
              },
            },
          },
          ApplyInfo: {},
          ApprovalDetails: {},
        };
      },

      onObjectMatched(oParameter) {
        if (!'A,B,C'.split(',').includes(oParameter.type)) {
          this.getRouter().navTo('attendance');
          return;
        }

        if (oParameter.type === this.PAGE_TYPE.CHANGE) {
          // Multiple table generate
          TableUtils.adjustRowSpan({
            oTable: this.byId('approveMultipleTable'),
            aColIndices: [0, 7],
            sTheadOrTbody: 'thead',
          });
        }

        const oViewModel = this.getView().getModel();
        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/type', oParameter.type);
        oViewModel.setProperty('/Appno', oParameter.appno);

        this.loadPage();
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.appno ? this.getBundleText('LABEL_00100') : ''; // 조회
        const mNavigationMap = {
          A: this.getBundleText('LABEL_04002'), // 신규신청
          B: this.getBundleText('LABEL_04003'), // 변경신청
          C: this.getBundleText('LABEL_04004'), // 취소신청
        };
        return `${mNavigationMap[oArguments.type]} ${sAction}`;
      },

      async loadPage() {
        const oView = this.getView();
        const oViewModel = oView.getModel();
        const sAppno = oViewModel.getProperty('/Appno');
        const sType = oViewModel.getProperty('/type');

        try {
          if (sAppno) {
            const mFilters = { Prcty: 'R' };

            if (_.isEqual(sAppno, 'NA')) {
              const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
              const [mSelectedRowData] = oListView.getModel().getProperty('/parameter/rowData');

              _.chain(mFilters).set('Pernr', mSelectedRowData.Pernr).set('Awart', mSelectedRowData.Awart).set('Begda', mSelectedRowData.Begda).commit();
            } else {
              _.set(mFilters, 'Appno', sAppno);
            }

            const mResultData = await this.readLeaveApplEmpList(mFilters);

            oViewModel.setProperty('/ZappStatAl', mResultData.ZappStatAl);
            oViewModel.setProperty('/form/listMode', 'None');

            this.setTableData({ sType, oViewModel, aRowData: [mResultData] });
            this.initializeApplyInfoBox(mResultData);
            this.initializeApprovalBox(mResultData);
          } else {
            if (sType === this.PAGE_TYPE.CHANGE || sType === this.PAGE_TYPE.CANCEL) {
              const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
              const aRowData = oListView.getModel().getProperty('/parameter/rowData');

              if (sType === this.PAGE_TYPE.CANCEL) {
                oViewModel.setProperty('/form/listMode', 'None');
              } else {
                aRowData.forEach((o) => (o.Tmrsn = ''));
              }

              // 변경|취소 신청의 경우 List페이지에서 선택된 데이터를 가져온다.
              this.setTableData({ sType, oViewModel, aRowData });
            }

            this.initializeApplyInfoBox();
          }

          this.initializeAttachBox();
        } catch (oError) {
          this.debug('Controller > Attendance Detail > loadPage Error', oError);

          if (oError instanceof Error) oError = new UI5Error({ message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.

          AppUtils.handleError(oError, {
            onClose: () => this.getRouter().navTo('attendance'),
          });
        }
      },

      setTableData({ sType, oViewModel, aRowData }) {
        oViewModel.setProperty('/form/rowCount', aRowData.length);
        oViewModel.setProperty(
          '/form/list',
          aRowData.map((o) => {
            if (sType === this.PAGE_TYPE.CHANGE) {
              return {
                ...o,
                isChanged: false,
                Abrtg2: o.Abrtg2 ? o.Abrtg2 : o.Abrtg,
                AbrtgTxt: Number(o.Abrtg),
                AbrtgTxt2: o.Abrtg2 ? Number(o.Abrtg2) : Number(o.Abrtg),
                Abrst2: o.Abrst2 ? o.Abrst2 : o.Abrst,
                Begda2: o.Begda2 ? o.Begda2 : o.Begda,
                Endda2: o.Endda2 ? o.Endda2 : o.Endda,
              };
            } else {
              return {
                ...o,
                AbrtgTxt: `${Number(o.Abrtg)}일`,
              };
            }
          })
        );

        this.toggleHasRowProperty();
      },

      initializeApplyInfoBox(detailData) {
        const oViewModel = this.getViewModel();

        if (_.isEmpty(detailData)) {
          const mSessionData = this.getSessionData();

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
        const sType = oViewModel.getProperty('/type') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus,
          Type: this.APPTP,
          Appno: sAppno,
          Max: 10,
          Visible: !(sType === this.PAGE_TYPE.CANCEL),
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'txt', 'png'],
        });
      },

      async openFormDialog() {
        const oView = this.getView();
        const oViewModel = this.getViewModel();

        AppUtils.setAppBusy(true, this);

        // 근태유형
        try {
          const aAwartCode = await this.readAwartCodeList();
          oViewModel.setProperty('/form/dialog/awartCodeList', aAwartCode);
        } catch (oError) {
          this.debug('Controller > Attendance Detail > openFormDialog Error', oError);
        }

        setTimeout(() => {
          if (!this.pFormDialog) {
            this.pFormDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.attendance.fragment.FormDialog',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }
          this.pFormDialog.then(function (oDialog) {
            oDialog.open();
          });
        }, 100);
      },

      toggleHasRowProperty() {
        const oViewModel = this.getViewModel();
        const sType = oViewModel.getProperty('/type');
        const aTableData = oViewModel.getProperty('/form/list');

        if (sType === this.PAGE_TYPE.CHANGE) {
          oViewModel.setProperty(
            '/form/hasRow',
            aTableData.some((cur) => cur.isChanged)
          );
        } else {
          oViewModel.setProperty('/form/hasRow', !!aTableData.length);
        }
      },

      async createProcess({ sPrcty = 'C' }) {
        const oViewModel = this.getViewModel();
        const iAttachLength = AttachFileAction.getFileCount.call(this);
        let sAppno = oViewModel.getProperty('/Appno');

        try {
          if (!sAppno) {
            sAppno = await Appno.get();
            oViewModel.setProperty('/Appno', sAppno);
          }

          if (iAttachLength > 0) {
            await AttachFileAction.uploadFile.call(this, sAppno, this.APPTP);
          }

          await this.createLeaveApplContent(sPrcty);

          // {임시저장|신청}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', this.ACTION_MESSAGE[sPrcty]), {
            onClose: () => {
              this.getRouter().navTo('attendance');
            },
          });
        } catch (oError) {
          this.debug('Controller > Attendance Detail > createProcess Error', oError);

          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false, this);
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onPressAddBtn() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/form/dialog/calcCompleted', false);
        oViewModel.setProperty('/form/dialog/data', { Awart: 'ALL' });

        this.openFormDialog();
      },

      onPressChangeBtn() {
        const oViewModel = this.getViewModel();
        const oTable = this.byId('approveMultipleTable');
        const aSelectedIndices = oTable.getSelectedIndices();

        if (aSelectedIndices.length < 1) {
          MessageBox.alert(this.getBundleText('MSG_00020', 'LABEL_00109')); // {변경}할 행을 선택하세요.
          return;
        } else if (aSelectedIndices.length > 1) {
          MessageBox.alert(this.getBundleText('MSG_00038')); // 하나의 행만 선택하세요.
          return;
        }

        const sRowPath = oTable.getRows()[aSelectedIndices[0]].getBindingContext().getPath();
        const mRowData = oViewModel.getProperty(sRowPath);

        oViewModel.setProperty('/form/dialog/calcCompleted', false);
        oViewModel.setProperty('/form/dialog/selectedRowPath', sRowPath);
        oViewModel.setProperty('/form/dialog/data', { ...mRowData, AbrtgTxt: `${mRowData.AbrtgTxt}일` });

        this.openFormDialog();
      },

      onPressDelBtn() {
        const oViewModel = this.getViewModel();
        const oTable = this.byId('approveSingleTable');
        const aSelectedIndices = oTable.getSelectedIndices();
        const aTableData = oViewModel.getProperty('/form/list');

        if (aSelectedIndices.length < 1) {
          MessageBox.alert(this.getBundleText('MSG_00020', 'LABEL_00110')); // {삭제}할 행을 선택하세요.
          return;
        }

        // 선택된 행을 삭제하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00021'), {
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            const aUnSelectedData = aTableData.filter((elem, idx) => {
              return !aSelectedIndices.some(function (iIndex) {
                return iIndex === idx;
              });
            });

            oViewModel.setProperty('/form/list', aUnSelectedData);
            oViewModel.setProperty('/form/rowCount', aUnSelectedData.length);

            this.toggleHasRowProperty();
            oTable.clearSelection();
          },
        });
      },

      onChangeAwartCombo(oEvent) {
        const oViewModel = this.getViewModel();
        const sSelectedValue = oEvent.getSource().getSelectedItem().getText();

        oViewModel.setProperty('/form/dialog/data/Atext', sSelectedValue);
        oViewModel.setProperty('/form/dialog/calcCompleted', false);
        oViewModel.setProperty('/form/dialog/data/Begda', null);
        oViewModel.setProperty('/form/dialog/data/Endda', null);
        oViewModel.setProperty('/form/dialog/data/Abrst', null);
        oViewModel.setProperty('/form/dialog/data/Abrtg', null);
        oViewModel.setProperty('/form/dialog/data/AbrtgTxt', null);
      },

      async onChangeLeaveDate() {
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/form/dialog/data');

        try {
          const mResultData = await this.readLeaveApplEmpList({ Prcty: 'C', Menid: this.getCurrentMenuId(), ..._.pick(mFormData, ['Awart', 'Begda', 'Endda']) });

          if (!_.isEmpty(mResultData)) {
            oViewModel.setProperty('/form/dialog/data/Abrst', mResultData.Abrst);
            oViewModel.setProperty('/form/dialog/data/Abrtg', mResultData.Abrtg);
            oViewModel.setProperty('/form/dialog/data/AbrtgTxt', `${parseInt(mResultData.Abrtg, 10)}일`);
            oViewModel.setProperty('/form/dialog/calcCompleted', true);
          }
        } catch (oError) {
          this.debug('Controller > Attendance Detail > onChangeLeaveDate Error', oError);

          AppUtils.handleError(oError);

          oViewModel.setProperty('/form/dialog/data/Abrst', null);
          oViewModel.setProperty('/form/dialog/data/Abrtg', null);
          oViewModel.setProperty('/form/dialog/data/AbrtgTxt', '');
          oViewModel.setProperty('/form/dialog/calcCompleted', false);
        }
      },

      onPressFormDialogClose() {
        AppUtils.setAppBusy(false, this);
        this.byId('formDialog').close();
      },

      onPressFormDialogSave() {
        const oViewModel = this.getViewModel();
        const sType = oViewModel.getProperty('/type');
        const bCalcCompleted = oViewModel.getProperty('/form/dialog/calcCompleted');
        const mInputData = oViewModel.getProperty('/form/dialog/data');
        const mCheckFields = [
          { field: 'Tmrsn', label: this.getBundleText('LABEL_04009'), type: Validator.INPUT2 }, // 근태사유
        ];
        let oTable;

        if (!bCalcCompleted) {
          MessageBox.error(this.getBundleText('MSG_04001')); // 계산이 수행되지 않아 저장이 불가합니다.
          return;
        }

        if (!Validator.check({ mFieldValue: mInputData, aFieldProperties: mCheckFields })) return;

        if (sType === this.PAGE_TYPE.CHANGE) {
          const sRowPath = oViewModel.getProperty('/form/dialog/selectedRowPath');
          const mRowData = oViewModel.getProperty(sRowPath);
          const mChangedData = {
            ...mRowData,
            ...mInputData,
            isChanged: true,
            AbrtgTxt: Number(mInputData.Abrtg),
            Tmrsn: mInputData.Tmrsn,
            Begda: DateUtils.parse(mInputData.Begda),
            Endda: DateUtils.parse(mInputData.Endda),
          };
          oTable = this.byId('approveMultipleTable');

          if (DateUtils.format(mRowData.Begda2) === DateUtils.format(mChangedData.Begda) && DateUtils.format(mRowData.Endda2) === DateUtils.format(mChangedData.Endda)) {
            MessageBox.error(this.getBundleText('MSG_04002')); // 변경된 데이터가 없습니다.
            return;
          }

          oViewModel.setProperty(sRowPath, mChangedData);
        } else {
          const aListData = oViewModel.getProperty('/form/list');
          oTable = this.byId('approveSingleTable');

          aListData.push({
            ...mInputData,
            Begda: DateUtils.parse(mInputData.Begda),
            Endda: DateUtils.parse(mInputData.Endda),
          });

          oViewModel.setProperty('/form/list', aListData);
          oViewModel.setProperty('/form/rowCount', aListData.length);
        }

        oTable.clearSelection();
        this.toggleHasRowProperty();

        AppUtils.setAppBusy(false, this);
        this.byId('formDialog').close();
      },

      onPressApproval() {
        AppUtils.setAppBusy(true, this);

        const sPrcty = 'C';

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [this.getBundleText('LABEL_00121'), MessageBox.Action.CANCEL],
          onClose: (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              AppUtils.setAppBusy(false, this);
              return;
            }

            this.createProcess({ sPrcty });
          },
        });
      },

      /*****************************************************************
       * ! Call OData
       *****************************************************************/
      readAwartCodeList() {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const oViewModel = this.getViewModel();
          const sUrl = '/AwartCodeListSet';
          const aAwartCodeList = oViewModel.getProperty('/form/dialog/awartCodeList');

          if (aAwartCodeList.length > 1) {
            resolve(aAwartCodeList);
          }

          oModel.read(sUrl, {
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(new ComboEntry({ codeKey: 'Awart', valueKey: 'Atext', aEntries: oData.results }));
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      /**
       *
       * @param {String} Prcty - R: 상세조회, C: 계산
       * @returns
       */
      readLeaveApplEmpList(mFilters) {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const sUrl = '/LeaveApplEmpListSet';

          oModel.read(sUrl, {
            filters: _.chain(mFilters)
              .omitBy(_.isNil)
              .map((v, p) => {
                if (_.isEqual(p, 'Begda') || _.isEqual(p, 'Endda')) {
                  return new Filter(p, FilterOperator.EQ, DateUtils.parse(v));
                } else {
                  return new Filter(p, FilterOperator.EQ, v);
                }
              })
              .value(),
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results[0] ?? {});
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      /**
       *
       * @param {String} sPrcty -  T:임시저장, C:신청
       * @returns
       */
      createLeaveApplContent(sPrcty) {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const mAppointeeData = this.getAppointeeData();
        const aTableData = oViewModel.getProperty('/form/list');
        const sAppty = oViewModel.getProperty('/type');
        const sAppno = oViewModel.getProperty('/Appno');
        const sMenid = this.getCurrentMenuId();
        const sUrl = '/LeaveApplContentSet';
        let aLeaveApplNav1 = [...aTableData];

        return new Promise((resolve, reject) => {
          if (sAppty === this.PAGE_TYPE.CHANGE) {
            aLeaveApplNav1 = aLeaveApplNav1.filter((o) => o.isChanged === true);
          }

          const oPayload = {
            Menid: sMenid,
            Pernr: mAppointeeData.Pernr,
            Orgeh: mAppointeeData.Orgeh,
            Appno: sAppno,
            Prcty: sPrcty,
            Appty: sAppty, // A:신규, B:변경, C:취소
            LeaveApplNav1: aLeaveApplNav1.map((o) => ({ ...o, Pernr: mAppointeeData.Pernr })),
          };

          oModel.create(sUrl, oPayload, {
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results ?? []);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataCreateError({ oError })); // {신청}중 오류가 발생하였습니다.
            },
          });
        });
      },
    });
  }
);
