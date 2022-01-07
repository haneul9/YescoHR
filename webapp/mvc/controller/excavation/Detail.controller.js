/* eslint-disable no-else-return */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    MessageBox,
    Client,
    UI5Error,
    Appno,
    AppUtils,
    AttachFileAction,
    ServiceNames,
    TableUtils,
    TextUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.excavation.Detail', {
      LIST_PAGE_ID: 'container-ehr---excavationList',
      APPTP: 'HR06',

      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,

      getPreviousRouteName() {
        return 'excavation';
      },

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          Appno: null,
          ZappStatAl: null,
          form: {
            hasRow: false,
            rowCount: 1,
            listMode: 'MultiToggle',
            Chgrsn: '',
            list: [],
            employees: [],
          },
          dialog: {
            busy: false,
            isActiveApproval: false,
            rowCount: 1,
            mode: 'C',
            listMode: 'MultiToggle',
            yearMonth: '',
            list: [],
            selectedData: [],
          },
          ApplyInfo: {},
          ApprovalDetails: {},
        });
        oViewModel.setSizeLimit(10000);
        this.setViewModel(oViewModel);

        TableUtils.adjustRowSpan({
          oTable: this.byId('approvalTable'),
          aColIndices: [0, 1, 2],
          sTheadOrTbody: 'thead',
        });
      },

      async onObjectMatched(oParameter) {
        const oViewModel = this.getView().getModel();

        oViewModel.setProperty('/Appno', oParameter.appno === 'n' ? null : oParameter.appno);

        this.loadPage();
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.appno === 'n' ? this.getBundleText('LABEL_00121') : this.getBundleText('LABEL_00100'); // 신청,조회

        return sAction;
      },

      async loadPage() {
        const oView = this.getView();
        const oViewModel = oView.getModel();
        const sAppno = oViewModel.getProperty('/Appno');

        try {
          if (sAppno) {
            const oModel = this.getModel(ServiceNames.WORKTIME);
            const aDetailData = await Client.getEntitySet(oModel, 'DrillChangeApp', { Appno: sAppno });
            const mDetail = aDetailData[0] ?? {};

            oViewModel.setProperty('/ZappStatAl', mDetail.ZappStatAl);
            oViewModel.setProperty('/form/Chgrsn', mDetail.Chgrsn);
            oViewModel.setProperty('/form/listMode', 'None');

            this.setTableData({ oViewModel, aRowData: [...aDetailData] });
            this.initializeApplyInfoBox(mDetail);
            this.initializeApprovalBox(mDetail);
          } else {
            const oModel = this.getModel(ServiceNames.COMMON);
            const aEmployees = await Client.getEntitySet(oModel, 'EmpSearchResult', {
              Menid: this.getCurrentMenuId(),
              Persa: this.getAppointeeProperty('Werks'),
              Stat2: '3',
              Zflag: 'X',
              Actda: moment().hour(9).toDate(),
            });

            oViewModel.setProperty(
              '/form/employees',
              aEmployees.map((o) => ({ ...o, Pernr: _.trimStart(o.Pernr, '0') }))
            );

            this.initializeApplyInfoBox();
          }

          this.initializeAttachBox();
        } catch (oError) {
          this.debug('Controller > excavation Detail > loadPage Error', oError);

          if (oError instanceof Error) oError = new UI5Error({ message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.

          AppUtils.handleError(oError, {
            onClose: () => this.getRouter().navTo('excavation'),
          });
        }
      },

      setTableData({ oViewModel, aRowData }) {
        oViewModel.setProperty('/form/rowCount', aRowData.length);
        oViewModel.setProperty('/form/list', aRowData);

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

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus,
          Type: this.APPTP,
          Appno: sAppno,
          Max: 10,
          FileTypes: 'jpg,jpeg,pdf,doc,docx,ppt,pptx,xls,xlsx,bmp,png'.split(','),
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

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const aTableData = oViewModel.getProperty('/form/list');
          const sChgrsn = oViewModel.getProperty('/form/Chgrsn');

          await Client.create(oModel, 'DrillChangeApp', {
            Menid: this.getCurrentMenuId(),
            Appno: sAppno,
            Prcty: sPrcty,
            Chgrsn: sChgrsn,
            DrillChangeNav: [...aTableData.map((o) => ({ ...o, Chgrsn: sChgrsn }))],
          });

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

          let aSummaryList = await Client.getEntitySet(oModel, 'DrillList', { Prcty: sMode, Zyymm: sYearMonth });

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
          onClose: function (sAction) {
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
        const sChgrsn = oViewModel.getProperty('/form/Chgrsn');

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
    });
  }
);
