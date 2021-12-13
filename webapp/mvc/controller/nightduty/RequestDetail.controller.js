/* eslint-disable no-else-return */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/table/SelectionMode',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    FilterOperator,
    JSONModel,
    SelectionMode,
    Appno,
    AppUtils,
    AttachFileAction,
    TableUtils,
    TextUtils,
    UI5Error,
    ODataReadError,
    ODataCreateError,
    ServiceNames,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.nightduty.RequestDetail', {
      LIST_PAGE_ID: 'container-ehr---excavationList',
      TYPE_CODE: 'HR06',

      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          Appno: null,
          ZappStatAl: null,
          detail: {
            hasRow: false,
            list: [],
            listMode: SelectionMode.MultiToggle,
            rowCount: 1,
            chgrsn: '',
            employees: [],
          },
          ApplyInfo: {},
          ApprovalDetails: {},
          dialog: {
            busy: false,
            isActiveApproval: false,
            rowCount: 1,
            mode: 'C',
            listMode: SelectionMode.MultiToggle,
            yearMonth: '',
            list: [],
            selectedData: [],
          },
        });
        oViewModel.setSizeLimit(10000);
        this.setViewModel(oViewModel);

        TableUtils.adjustRowSpan({
          table: this.byId('detailListTable'),
          colIndices: [0, 1, 2],
          theadOrTbody: 'thead',
        });
      },

      async onObjectMatched(parameters = {}) {
        this.getViewModel().setProperty('/Appno', parameters.appno || 0);

        this.readData();
      },

      getCurrentLocationText(args) {
        const sAction = args.appno ? this.getBundleText('LABEL_00100') : this.getBundleText('LABEL_00121'); // 조회 : 신청

        return sAction;
      },

      async readData() {
        const oViewModel = this.getViewModel();
        const sAppno = oViewModel.getProperty('/Appno');

        try {
          if (sAppno) {
            const oModel = this.getModel(ServiceNames.WORKTIME);
            const aDetailData = await this.readDrillChangeAppSet({ oModel, sAppno });
            const mDetail = aDetailData[0] || {};

            oViewModel.setProperty('/ZappStatAl', mDetail.ZappStatAl);
            oViewModel.setProperty('/detail/chgrsn', mDetail.chgrsn);
            oViewModel.setProperty('/detail/listMode', SelectionMode.None);

            this.setTableData({ oViewModel, aRowData: aDetailData });
            this.initApplyInfoBox(mDetail);
            this.initApprovalBox(mDetail);
          } else {
            const aEmployees = await this.readEmpSearchResult();

            oViewModel.setProperty(
              '/form/employees',
              aEmployees.map((o) => ({ ...o, Pernr: o.Pernr.replace(/^0+/, '') }))
            );

            this.initApplyInfoBox();
          }

          this.initializeAttachBox();
        } catch (oError) {
          this.debug('Controller > Nightduty Detail > loadPage Error', oError);

          if (oError instanceof Error) {
            oError = new UI5Error({ message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.
          }

          AppUtils.handleError(oError, {
            onClose: () => this.getRouter().navTo('nightduty'),
          });
        }
      },

      setTableData({ oViewModel, aRowData }) {
        oViewModel.setProperty('/form/rowCount', aRowData.length);
        oViewModel.setProperty('/form/list', aRowData);

        this.toggleHasRowProperty();
      },

      initApplyInfoBox(detailData) {
        const oViewModel = this.getViewModel();

        if (_.isEmpty(detailData)) {
          const mAppointeeData = this.getAppointeeData();

          oViewModel.setProperty('/ApplyInfo', {
            Apename: mAppointeeData.Ename,
            Aporgtx: `${mAppointeeData.Btrtx}/${mAppointeeData.Orgtx}`,
            Apjikgbtl: `${mAppointeeData.Zzjikgbt}/${mAppointeeData.Zzjiktlt}`,
          });
        } else {
          oViewModel.setProperty('/ApplyInfo', detailData);
        }
      },

      initApprovalBox(detailData) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/ApprovalDetails', detailData);
      },

      initializeAttachBox() {
        const oViewModel = this.getViewModel();
        const sStatus = oViewModel.getProperty('/ZappStatAl');
        const sAppno = oViewModel.getProperty('/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus,
          Type: this.TYPE_CODE,
          Appno: sAppno,
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },

      async openFormDialog() {
        const oView = this.getView();

        AppUtils.setAppBusy(true, this);

        if (!this.pDrillDialog) {
          this.pDrillDialog = Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.excavation.fragment.DialogTable',
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }
        this.pDrillDialog.then(function (oDialog) {
          oDialog.open();
        });
      },

      toggleHasRowProperty() {
        const oViewModel = this.getViewModel();
        const aTableData = oViewModel.getProperty('/form/list');

        oViewModel.setProperty('/form/hasRow', !!aTableData.length);
      },

      async createProcess({ sPrcty = 'C' }) {
        const oViewModel = this.getViewModel();
        const iAttachLength = AttachFileAction.getFileLength.call(this);
        let sAppno = oViewModel.getProperty('/Appno');

        try {
          if (!sAppno) {
            sAppno = await Appno.get();
            oViewModel.setProperty('/Appno', sAppno);
          }

          if (iAttachLength > 0) {
            await AttachFileAction.uploadFile.call(this, sAppno, this.TYPE_CODE);
          }

          await this.createDrillChangeApp(sPrcty);

          // {신청}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', this.getBundleText('LABEL_00121')), {
            onClose: () => {
              this.getRouter().navTo('excavation');
            },
          });
        } catch (oError) {
          this.debug('Controller > excavation Detail > createProcess Error', oError);

          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false, this);
        }
      },

      async retrieveCurrentDuty() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const aList = oViewModel.getProperty('/form/list');
        const sMode = oViewModel.getProperty('/dialog/mode');
        const sYearMonth = oViewModel.getProperty('/dialog/yearMonth');

        try {
          oViewModel.setProperty('/dialog/busy', true);

          let aSummaryList = await this.readDrillList({ oModel, sMode, sYearMonth });

          aSummaryList = _.differenceWith(aSummaryList, aList, (a, b) => moment(a.Datum).format('YYYYMMDD') === moment(b.Datum).format('YYYYMMDD'));

          oViewModel.setProperty('/dialog/list', [...aSummaryList]);
          oViewModel.setProperty('/dialog/rowCount', aSummaryList.length || 1);
        } catch (oError) {
          this.debug('Controller > excavation Detail > retrieveCurrentDuty Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/dialog/busy', false);
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onPressAddBtn() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/dialog/yearMonth', moment().format('YYYYMM'));
        this.retrieveCurrentDuty();

        this.openFormDialog();
      },

      onPressDelBtn() {
        const oViewModel = this.getViewModel();
        const oTable = this.byId('approvalTable');
        const aSelectedIndices = oTable.getSelectedIndices();
        const aTableData = oViewModel.getProperty('/form/list');

        if (aSelectedIndices.length < 1) {
          MessageBox.alert(this.getBundleText('MSG_00020', 'LABEL_00110')); // {삭제}할 행을 선택하세요.
          return;
        }

        // 선택된 행을 삭제하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00021'), {
          onClose: function (oAction) {
            if (MessageBox.Action.OK === oAction) {
              const aUnSelectedData = aTableData.filter((elem, idx) => {
                return !aSelectedIndices.some(function (iIndex) {
                  return iIndex === idx;
                });
              });

              oViewModel.setProperty('/form/list', aUnSelectedData);
              oViewModel.setProperty('/form/rowCount', aUnSelectedData.length);

              this.toggleHasRowProperty();
              oTable.clearSelection();
            }
          }.bind(this),
        });
      },

      onSelectSuggest(oEvent) {
        const oViewModel = this.getViewModel();
        const oSelectedItem = oEvent.getParameter('selectedItem');
        const sRowPath = oEvent.getSource()?.getParent()?.getBindingContext()?.getPath();
        let mEmployee = { Pernr: '', Ename: '', Fulln: '', Zzjikgbt: '' };

        if (!_.isEmpty(oSelectedItem)) {
          const sSelectedPernr = oEvent.getParameter('selectedItem')?.getKey() ?? 'None';
          const aEmployees = oViewModel.getProperty('/form/employees');

          mEmployee = _.find(aEmployees, { Pernr: sSelectedPernr }) ?? { Pernr: '', Ename: '', Fulln: '', Zzjikgbt: '' };
        }

        if (sRowPath) {
          oViewModel.setProperty(sRowPath, {
            ...oViewModel.getProperty(sRowPath),
            PernrA: mEmployee.Pernr,
            EnameA: mEmployee.Ename,
            OrgtxA: mEmployee.Fulln,
            ZzjikgbtA: mEmployee.Zzjikgbt,
          });
        }
      },

      async onChangeDialogSearch() {
        this.retrieveCurrentDuty();
      },

      onChangeRowSelection(oEvent) {
        const oTable = oEvent.getSource();
        const oViewModel = this.getViewModel();
        const aSelectedIndices = oTable.getSelectedIndices();

        oViewModel.setProperty('/dialog/isActiveApproval', !!aSelectedIndices.length);
        oViewModel.setProperty(
          '/dialog/selectedData',
          aSelectedIndices.map((idx) => oViewModel.getProperty(`/dialog/list/${idx}`))
        );
      },

      onPressAddData(oEvent) {
        const oViewModel = this.getViewModel();
        const aSelectedData = oViewModel.getProperty('/dialog/selectedData');
        const aList = [
          ...oViewModel.getProperty('/form/list'),
          ...aSelectedData.map((o) => ({
            Datum: o.Datum,
            Kurzt: o.Kurzt,
            Tagty: o.Tagty,
            PernrB: o.Pernr,
            EnameB: o.Ename,
            OrgtxB: o.Orgtx,
            ZzjikgbtB: o.Zzjikgbt,
          })),
        ];

        oViewModel.setProperty('/form/rowCount', aList.length);
        oViewModel.setProperty('/form/list', aList);
        oViewModel.setProperty('/dialog/selectedData', []);

        this.toggleHasRowProperty();
        this.onPressSummaryDialogClose(oEvent);
      },

      onPressSummaryDialogClose(oEvent) {
        AppUtils.setAppBusy(false, this);

        oEvent.getSource().getParent().getContent()[1].clearSelection();
        this.byId('summaryDialog').close();
      },

      onPressApproval() {
        const oViewModel = this.getViewModel();
        const sPrcty = 'C';
        const aList = oViewModel.getProperty('/form/list');
        const sChgrsn = oViewModel.getProperty('/form/chgrsn');

        if (!sChgrsn) {
          MessageBox.alert(this.getBundleText('MSG_00003', 'LABEL_04013')); // {변경사유}를 입력하세요.
          return;
        }

        if (!_.some(aList, 'PernrA')) {
          MessageBox.alert(this.getBundleText('MSG_00005', 'LABEL_11006')); // {근무자}를 선택하세요.
          return;
        }

        AppUtils.setAppBusy(true, this);

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
      readEmpSearchResult() {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.COMMON);
          const sMenid = this.getCurrentMenuId();
          const sPersa = this.getAppointeeProperty('Werks');
          const sUrl = '/EmpSearchResultSet';

          oModel.read(sUrl, {
            filters: [
              new Filter('Menid', FilterOperator.EQ, sMenid), //
              new Filter('Persa', FilterOperator.EQ, sPersa),
              new Filter('Stat2', FilterOperator.EQ, '3'),
              new Filter('Zflag', FilterOperator.EQ, 'X'),
              new Filter('Actda', FilterOperator.EQ, moment().hour(9).toDate()),
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results ?? []);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      readDrillList({ oModel, sMode, sYearMonth }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/DrillListSet';

          oModel.read(sUrl, {
            filters: [
              new Filter('Prcty', FilterOperator.EQ, sMode), //
              new Filter('Zyymm', FilterOperator.EQ, sYearMonth),
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results ?? []);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      readDrillChangeAppSet({ oModel, sAppno }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/DrillChangeAppSet';

          oModel.read(sUrl, {
            filters: [
              new Filter('Appno', FilterOperator.EQ, sAppno), //
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
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
      createDrillChangeApp(sPrcty) {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const aTableData = oViewModel.getProperty('/detail/list');
        const sChgrsn = oViewModel.getProperty('/detail/chgrsn');
        const sAppno = oViewModel.getProperty('/Appno');
        const sMenid = this.getCurrentMenuId();
        const sUrl = '/DrillChangeAppSet';

        return new Promise((resolve, reject) => {
          const mPayload = {
            Menid: sMenid,
            Appno: sAppno,
            Prcty: sPrcty,
            Chgrsn: sChgrsn,
            DrillChangeNav: [...aTableData.map((o) => ({ ...o, Chgrsn: sChgrsn }))],
          };

          oModel.create(sUrl, mPayload, {
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
