sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/table/SelectionMode',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/nightduty/CurrentListDialogHandler',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    Filter,
    FilterOperator,
    SelectionMode,
    AppUtils,
    TableUtils,
    ODataReadError,
    ServiceNames,
    CurrentListDialogHandler
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.mvc.controller.nightduty.RequestDetailHelper', {
      sDetailListTableId: 'detailListTable',

      constructor: function (oController) {
        const oModel = new JSONModel({
          detail: {
            editable: false,
            enabled: false,
            list: [],
            listMode: SelectionMode.MultiToggle,
            rowCount: 1,
            chgrsn: '',
            employees: [],
          },
        });

        this.oController = oController;
        this.oDetailListModel = oModel;
        this.oCurrentListDialogHandler = new CurrentListDialogHandler(this.oController, SelectionMode.MultiToggle);

        oController.byId('nightduty-request-detail').setModel(oModel);

        TableUtils.adjustRowSpan({
          oTable: this.byId(this.sDetailListTableId),
          aColIndices: [0, 1, 2],
          sTheadOrTbody: 'thead',
        });
      },

      /**
       * 신청 상세 조회
       * @param {string} sAppno
       * @returns
       */
      readRequestDetailData(sAppno) {
        return new Promise((resolve, reject) => {
          const sUrl = '/OnCallChangeAppSet';
          const sMenid = this.oController.getCurrentMenuId();

          this.oController.getModel(ServiceNames.WORKTIME).read(sUrl, {
            filters: [
              new Filter('Menid', FilterOperator.EQ, sMenid), //
              new Filter('Appno', FilterOperator.EQ, sAppno),
            ],
            success: (mData) => {
              AppUtils.debug(`${sUrl} success.`, mData);

              resolve(mData.results);
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      setData(aDetailListData, bFormEditable) {
        const mDetailData = aDetailListData[0] || {};

        this.oDetailListModel.setProperty('/detail/editable', bFormEditable);
        this.oDetailListModel.setProperty('/detail/chgrsn', mDetailData.Chgrsn);
        this.oDetailListModel.setProperty('/detail/listMode', SelectionMode.None);

        this.setDetailListData(aDetailListData);
      },

      setDetailListData(aDetailListData = []) {
        const iRowCount = aDetailListData.length;

        oViewModel.setProperty('/detail/list', aDetailListData);
        oViewModel.setProperty('/detail/rowCount', iRowCount);
        oViewModel.setProperty('/detail/enabled', iRowCount > 0);
      },

      openCurrentListDialog() {
        this.oCurrentListDialogHandler.openDialog();
      },

      removeDetailListTableRows() {
        const aDetailListData = this.oDetailListModel.getProperty('/detail/list');
        const oDetailListTable = this.oController.byId(this.sDetailListTableId);
        const aSelectedIndices = oDetailListTable.getSelectedIndices();

        if (aSelectedIndices.length < 1) {
          MessageBox.alert(this.oController.getBundleText('MSG_00020', 'LABEL_00110')); // {삭제}할 행을 선택하세요.
          return;
        }

        // 선택된 행을 삭제하시겠습니까?
        MessageBox.confirm(this.oController.getBundleText('MSG_00021'), {
          onClose: (oAction) => {
            if (MessageBox.Action.OK === oAction) {
              const aUnselectedData = aDetailListData.filter((elem, i) => {
                return !aSelectedIndices.includes(i);
              });

              oDetailListTable.clearSelection();

              this.setDetailListData(aUnselectedData);
            }
          },
        });
      },

      readSuggestionData() {
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

      onSelectSuggestion(oEvent) {
        const oViewModel = this.getViewModel();
        const oSelectedItem = oEvent.getParameter('selectedItem');
        const sRowPath = oEvent.getSource()?.getParent()?.getBindingContext()?.getPath();
        let mEmployee = { Pernr: '', Ename: '', Fulln: '', Zzjikgbt: '' };

        if (!_.isEmpty(oSelectedItem)) {
          const sSelectedPernr = oEvent.getParameter('selectedItem')?.getKey() ?? 'None';
          const aEmployees = oViewModel.getProperty('/detail/employees');

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
        const aDetailListData = [
          ...oViewModel.getProperty('/detail/list'),
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

        this.setDetailListData(aDetailListData);
        oViewModel.setProperty('/dialog/selectedData', []);

        this.onPressSummaryDialogClose(oEvent);
      },

      onPressSummaryDialogClose(oEvent) {
        AppUtils.setAppBusy(false, this);

        oEvent.getSource().getParent().getContent()[1].clearSelection();
        this.byId('summaryDialog').close();
      },
    });
  }
);
