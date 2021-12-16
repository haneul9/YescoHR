sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
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
    JSONModel,
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
      oApprovalRequestHelper: null,

      constructor: function (oController, oApprovalRequestHelper) {
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
        this.oApprovalRequestHelper = oApprovalRequestHelper;
        this.oDetailListModel = oModel;
        this.oCurrentListDialogHandler = new CurrentListDialogHandler({ oController: this.oController, sSelectionMode: SelectionMode.MultiToggle, fnCallback: this.appendDetailListTableRows.bind(this) });

        oController.byId('nightduty-request-detail-toolbar').setModel(oModel);
        oController.byId('nightduty-request-detail-list').setModel(oModel);
        oController.byId('nightduty-request-detail-reason').setModel(oModel);

        TableUtils.adjustRowSpan({
          oTable: this.oController.byId(this.sDetailListTableId),
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
        const mDetailData = (aDetailListData || [])[0] || {};

        this.oDetailListModel.setProperty('/detail/editable', bFormEditable);
        this.oDetailListModel.setProperty('/detail/chgrsn', mDetailData.Chgrsn);
        this.oDetailListModel.setProperty('/detail/listMode', SelectionMode.None);

        this.setDetailListData(aDetailListData);

        return this;
      },

      setDetailListData(aDetailListData) {
        const iRowCount = (aDetailListData || []).length;

        this.oDetailListModel.setProperty('/detail/list', aDetailListData);
        this.oDetailListModel.setProperty('/detail/rowCount', iRowCount);
        this.oDetailListModel.setProperty('/detail/enabled', iRowCount > 0);

        return this;
      },

      openCurrentListDialog() {
        this.oCurrentListDialogHandler.openDialog();

        return this;
      },

      appendDetailListTableRows(aSelectedListData) {
        const aDetailListData = this.oDetailListModel.getProperty('/detail/list') || [];
        aDetailListData.splice(
          aDetailListData.length,
          0,
          ...(aSelectedListData || []).map((o) => ({
            Datum: o.Datum,
            Kurzt: o.Kurzt,
            Tagty: o.Tagty,
            PernrB: o.Pernr,
            EnameB: o.Ename,
            OrgtxB: o.Orgtx,
            ZzjikgbtB: o.Zzjikgbt,
          }))
        );

        this.setDetailListData(aDetailListData);

        return this;
      },

      removeDetailListTableRows() {
        const aDetailListData = this.oDetailListModel.getProperty('/detail/list') || [];
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

      async prepareSuggestionData() {
        const aEmployees = await this.readSuggestionData();
        aEmployees.forEach((o) => {
          o.Pernr = o.Pernr.replace(/^0+/, '');
        });

        this.oDetailListModel.setProperty('/detail/employees', aEmployees);
      },

      readSuggestionData() {
        return new Promise((resolve, reject) => {
          const sMenid = this.oController.getCurrentMenuId();
          const sPersa = this.oController.getAppointeeProperty('Werks');
          const sUrl = '/EmpSearchResultSet';

          this.oController.getModel(ServiceNames.COMMON).read(sUrl, {
            filters: [
              new Filter('Menid', FilterOperator.EQ, sMenid), //
              new Filter('Persa', FilterOperator.EQ, sPersa),
              new Filter('Stat2', FilterOperator.EQ, '3'),
              new Filter('Zflag', FilterOperator.EQ, 'X'),
              new Filter('Actda', FilterOperator.EQ, moment().hour(9).toDate()),
            ],
            success: (oData) => {
              AppUtils.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      onSelectSuggestion(oEvent) {
        let mEmployee;

        const oSelectedItem = oEvent.getParameter('selectedItem');
        if (oSelectedItem) {
          const sSelectedPernr = oSelectedItem.getKey() || 'None';
          const aEmployees = this.oDetailListModel.getProperty('/detail/employees') || [];

          mEmployee = _.find(aEmployees, { Pernr: sSelectedPernr });
        }

        mEmployee ||= { Pernr: '', Ename: '', Fulln: '', Zzjikgbt: '' };

        const sRowPath = oEvent.getSource()?.getParent()?.getBindingContext()?.getPath();
        if (sRowPath) {
          this.oDetailListModel.setProperty(sRowPath, {
            ...this.oDetailListModel.getProperty(sRowPath),
            PernrA: mEmployee.Pernr,
            EnameA: mEmployee.Ename,
            OrgtxA: mEmployee.Fulln,
            ZzjikgbtA: mEmployee.Zzjikgbt,
          });
        }
      },
    });
  }
);
