sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/model/json/JSONModel',
    'sap/ui/table/SelectionMode',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/nightduty/CurrentListDialogHandler',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    JSONModel,
    SelectionMode,
    AppUtils,
    TableUtils,
    Client,
    ServiceNames,
    MessageBox,
    CurrentListDialogHandler
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.mvc.controller.nightduty.RequestDetail', {
      sScheduleTableId: 'scheduleTable',

      constructor: function (oController) {
        const oModel = new JSONModel({
          detail: {
            editable: false,
            enabled: false,
            suggestCompleted: false,
            list: [],
            listMode: SelectionMode.None,
            rowCount: 1,
            chgrsn: '',
            employees: [],
          },
        });

        this.oController = oController;
        this.oDetailModel = oModel;
        this.oCurrentListDialogHandler = new CurrentListDialogHandler({
          oController: this.oController,
          sSelectionMode: SelectionMode.MultiToggle,
          fnCallback: this.appendSchedule.bind(this),
        });

        oController.byId('nightduty-request-detail-toolbar').setModel(oModel);
        oController.byId('nightduty-request-detail-list').setModel(oModel);
        oController.byId('nightduty-request-detail-reason').setModel(oModel);

        TableUtils.adjustRowSpan({
          oTable: this.oController.byId(this.sScheduleTableId),
          aColIndices: [0, 1, 2],
          sTheadOrTbody: 'thead',
        });
      },

      async showData(sAppno, bFormEditable = false) {
        let aScheduleTableData;
        let mDetailData;

        if (sAppno) {
          // 임시저장 상태 또는 상세 조회
          aScheduleTableData = await this.readData(sAppno);
          mDetailData = (aScheduleTableData || [])[0] || {};
        }

        this.mDetailData = mDetailData || {};
        this.oDetailModel.setProperty('/detail/editable', bFormEditable);
        this.oDetailModel.setProperty('/detail/chgrsn', this.mDetailData.Chgrsn);
        this.oDetailModel.setProperty('/detail/listMode', bFormEditable ? SelectionMode.MultiToggle : SelectionMode.None);

        this.setScheduleTableData(aScheduleTableData);

        this.prepareSuggestionData();

        return this;
      },

      /**
       * 신청 상세 조회
       * @param {string} sAppno
       * @returns
       */
      async readData(sAppno) {
        const oModel = this.oController.getModel(ServiceNames.WORKTIME);
        const sUrl = 'OnCallChangeApp';
        const mFilters = {
          Menid: this.oController.getCurrentMenuId(),
          Appno: sAppno,
        };

        return Client.getEntitySet(oModel, sUrl, mFilters);
      },

      setScheduleTableData(aScheduleTableData) {
        const iRowCount = (aScheduleTableData || []).length;

        this.oDetailModel.setProperty('/detail/list', aScheduleTableData);
        this.oDetailModel.setProperty('/detail/rowCount', iRowCount);
        this.oDetailModel.setProperty('/detail/enabled', iRowCount > 0);

        return this;
      },

      getData() {
        return this.mDetailData;
      },

      showFileAttachmentBox() {
        return true;
      },

      openCurrentListDialog() {
        this.oCurrentListDialogHandler.openDialog();

        return this;
      },

      appendSchedule(aSelectedListData) {
        const aScheduleTableData = this.oDetailModel.getProperty('/detail/list') || [];
        aScheduleTableData.splice(
          aScheduleTableData.length,
          0,
          ...(aSelectedListData || []).map((o) => ({
            Datum: o.Datum,
            Kurzt: o.Kurzt,
            Tagty: o.Tagty,
            Awart: o.Awart,
            Ocshf: o.Ocshf,
            PernrB: o.Pernr,
            EnameB: o.Ename,
            OrgtxB: o.Orgtx,
            ZzjikgbtB: o.Zzjikgbt,
          }))
        );

        this.setScheduleTableData(aScheduleTableData);

        return this;
      },

      removeSchedule() {
        const aScheduleTableData = this.oDetailModel.getProperty('/detail/list') || [];
        const oScheduleTable = this.oController.byId(this.sScheduleTableId);
        const aSelectedIndices = oScheduleTable.getSelectedIndices();

        if (!aSelectedIndices.length) {
          MessageBox.alert(AppUtils.getBundleText('MSG_00020', 'LABEL_00110')); // {삭제}할 행을 선택하세요.
          return;
        }

        // 선택된 행을 삭제하시겠습니까?
        MessageBox.confirm(AppUtils.getBundleText('MSG_00021'), {
          onClose: (sAction) => {
            if (sAction !== MessageBox.Action.OK) {
              return;
            }

            const aUnselectedData = aScheduleTableData.filter((elem, i) => {
              return !aSelectedIndices.includes(i);
            });

            oScheduleTable.clearSelection();

            this.setScheduleTableData(aUnselectedData);
          },
        });
      },

      async prepareSuggestionData() {
        const aEmployees = await this.readSuggestionData();
        aEmployees.forEach((o) => {
          o.Pernr = o.Pernr.replace(/^0+/, '');
        });

        this.oDetailModel.setProperty('/detail/employees', aEmployees);
      },

      async readSuggestionData() {
        const oModel = this.oController.getModel(ServiceNames.COMMON);
        const sUrl = 'EmpSearchResult';
        const mFilters = {
          Menid: this.oController.getCurrentMenuId(),
          Persa: this.oController.getAppointeeProperty('Werks'),
          Stat2: '3',
          Zflag: 'X',
          Actda: moment().hour(9).toDate(),
        };

        return Client.getEntitySet(oModel, sUrl, mFilters);
      },

      onSelectSuggestion(oEvent) {
        let mEmployee;

        const oSelectedItem = oEvent.getParameter('selectedItem');
        const sRowPath = oEvent.getSource().getParent().getBindingContext().getPath();

        if (oSelectedItem && sRowPath) {
          const sSelectedPernr = oSelectedItem.getKey() || 'None';
          const aEmployees = this.oDetailModel.getProperty('/detail/employees') || [];

          mEmployee = _.find(aEmployees, { Pernr: sSelectedPernr });
          mEmployee ||= { Pernr: '', Ename: '', Fulln: '', Zzjikgbt: '' };

          this.oDetailModel.setProperty('/detail/suggestCompleted', true);
          this.oDetailModel.setProperty(sRowPath, {
            ...this.oDetailModel.getProperty(sRowPath),
            PernrA: mEmployee.Pernr,
            EnameA: mEmployee.Ename,
            OrgtxA: mEmployee.Fulln,
            ZzjikgbtA: mEmployee.Zzjikgbt,
          });
        }
      },

      onSubmitSuggest(oEvent) {
        const sInputValue = oEvent.getParameter('value');
        const bSuggestCompleted = this.oDetailModel.getProperty('/detail/suggestCompleted');

        if (bSuggestCompleted) {
          this.oDetailModel.setProperty('/detail/suggestCompleted', false);
          return;
        }
        if (_.isNaN(parseInt(sInputValue))) return;

        const sRowPath = oEvent.getSource()?.getParent()?.getBindingContext()?.getPath();
        const aEmployees = this.oDetailModel.getProperty('/detail/employees');
        const [mEmployee] = _.filter(aEmployees, (o) => _.startsWith(o.Pernr, sInputValue));

        if (sRowPath && !_.isEmpty(mEmployee)) {
          this.oDetailModel.setProperty(sRowPath, {
            ...this.oDetailModel.getProperty(sRowPath),
            PernrA: mEmployee.Pernr,
            EnameA: mEmployee.Ename,
            OrgtxA: mEmployee.Fulln,
            ZzjikgbtA: mEmployee.Zzjikgbt,
          });
        }
      },

      /**
       * 신청 정보 유효성 검사
       */
      validateRequestData() {
        const aScheduleTableData = this.oDetailModel.getProperty('/detail/list');
        if (!_.every(aScheduleTableData, 'PernrA')) {
          throw new UI5Error({ message: AppUtils.getBundleText('MSG_00005', 'LABEL_11006') }); // {근무자}를 선택하세요.
        }

        const sChgrsn = this.oDetailModel.getProperty('/detail/chgrsn');
        if (!sChgrsn) {
          throw new UI5Error({ message: AppUtils.getBundleText('MSG_00003', 'LABEL_04013') }); // {변경사유}를 입력하세요.
        }
      },

      /**
       * 신청
       * @param {string} sPrcty - T:임시저장, C:신청
       * @returns
       */
      requestApproval({ sAppno, sPrcty = 'C' }) {
        const aDetailListData = this.oDetailModel.getProperty('/detail/list');
        const sChgrsn = this.oDetailModel.getProperty('/detail/chgrsn');

        const oModel = this.oController.getModel(ServiceNames.WORKTIME);
        const sUrl = 'OnCallChangeApp';
        const mPayload = {
          Menid: this.oController.getCurrentMenuId(),
          Appno: sAppno,
          Prcty: sPrcty,
          Chgrsn: sChgrsn,
          OnCallChangeNav: aDetailListData.map((o) => ({ ...o, Chgrsn: sChgrsn })),
        };

        return Client.create(oModel, sUrl, mPayload);
      },
    });
  }
);
