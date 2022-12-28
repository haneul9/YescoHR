sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/table/SelectionMode',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/approvalRequest/DetailDataHandler',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/nightduty/CurrentListDialogHandler',
  ],
  (
    // prettier 방지용 주석
    SelectionMode,
    AppUtils,
    TableUtils,
    ApprovalRequestDetailDataHandler,
    UI5Error,
    Client,
    ServiceNames,
    MessageBox,
    CurrentListDialogHandler
  ) => {
    'use strict';

    return ApprovalRequestDetailDataHandler.extend('sap.ui.yesco.mvc.controller.nightduty.ApprovalRequestDetailDataHandler', {
      sToBeScheduleTableId: 'toBeScheduleTable',

      async onInit() {
        const mConfig = {
          oController: this.oController,
          sPrcty: 'C',
          sSelectionMode: SelectionMode.MultiToggle,
          fnCallback: this.appendToBeSchedule.bind(this),
        };
        this.oCurrentListDialogHandler = new CurrentListDialogHandler(mConfig);

        TableUtils.adjustRowSpan({
          oTable: this.oController.byId(this.sToBeScheduleTableId),
          aColIndices: [0, 1, 2],
          sTheadOrTbody: 'thead',
        });
      },

      getApprovalRequestModelInitDetailData() {
        return {
          list: [],
          listMode: SelectionMode.None,
          listInfo: {
            count: {
              visibleRows: 1,
            },
          },
          Chgrsn: '',
        };
      },

      onAfterInitModel(oApprovalRequestModel) {
        oApprovalRequestModel.setSizeLimit(10000); // employees suggestion item 최대 개수 기본값은 100이므로 제한을 늘려줌
      },

      /**
       * 신청 상세 조회
       * @param {string} sAppno
       * @returns
       */
      async readData(sAppno) {
        const oModel = this.oController.getModel(ServiceNames.WORKTIME);
        const mFilters = {
          Menid: this.oController.getCurrentMenuId(),
          Appno: sAppno,
          Pernr: this.oController.getAppointeeProperty('Pernr'),
        };

        return Client.getEntitySet(oModel, 'OnCallChangeApp', mFilters);
      },

      async showData(aResultsData, bFormEditable = false) {
        const [mDetailData = {}] = aResultsData;

        this.mDetailData = mDetailData || {};
        this.setDetailProperty('Chgrsn', mDetailData.Chgrsn);
        this.setDetailProperty('listMode', bFormEditable ? SelectionMode.MultiToggle : SelectionMode.None);

        this.setToBeScheduleTableData(aResultsData);

        this.prepareSuggestionData();

        return this;
      },

      setToBeScheduleTableData(aToBeScheduleTableData) {
        const iRowCount = (aToBeScheduleTableData || []).length;

        this.setDetailProperty('list', aToBeScheduleTableData);
        this.setDetailProperty('listInfo/count/visibleRows', iRowCount);
        this.setConfigProperty('enabled', iRowCount > 0);

        return this;
      },

      openCurrentListDialog() {
        const sPernr = this.oController.getAppointeeProperty('Pernr');
        const aPernrList = _.chain(this.getDetailProperty('list'))
          .reduce((acc, cur) => [...acc, _.get(cur, 'PernrA'), _.get(cur, 'PernrB')], [sPernr])
          .uniq()
          .value();

        this.oCurrentListDialogHandler.openDialog(aPernrList);

        return this;
      },

      appendToBeSchedule(aSelectedListData) {
        const aToBeScheduleTableData = this.getDetailProperty('list') || [];
        aToBeScheduleTableData.splice(
          aToBeScheduleTableData.length,
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

        // 2행인 경우에만 복사해줌
        if (aToBeScheduleTableData.length === 2) {
          _.chain(aToBeScheduleTableData[1])
            .set('PernrA', aToBeScheduleTableData[0].PernrB)
            .set('EnameA', aToBeScheduleTableData[0].EnameB)
            .set('OrgtxA', aToBeScheduleTableData[0].OrgtxB)
            .set('ZzjikgbtA', aToBeScheduleTableData[0].ZzjikgbtB)
            .commit();
        }

        this.setToBeScheduleTableData(aToBeScheduleTableData);

        return this;
      },

      removeToBeSchedule() {
        const aToBeScheduleTableData = this.getDetailProperty('list') || [];
        const oToBeScheduleTable = this.oController.byId(this.sToBeScheduleTableId);
        const aSelectedIndices = oToBeScheduleTable.getSelectedIndices();

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

            const aUnselectedData = aToBeScheduleTableData.filter((elem, i) => {
              return !aSelectedIndices.includes(i);
            });

            oToBeScheduleTable.clearSelection();

            this.setToBeScheduleTableData(aUnselectedData);
          },
        });
      },

      async prepareSuggestionData() {
        const aEmployees = await this.readSuggestionData();
        aEmployees.forEach((o) => {
          o.Pernr = o.Pernr.replace(/^0+/, '');
        });

        this.setConfigProperty('employees', aEmployees);
      },

      async readSuggestionData() {
        const oModel = this.oController.getModel(ServiceNames.COMMON);
        const mFilters = {
          Menid: this.oController.getCurrentMenuId(),
          Persa: this.oController.getAppointeeProperty('Werks'),
          Stat2: '3',
          Zflag: 'X',
          Actda: moment().hour(9).toDate(),
        };

        return Client.getEntitySet(oModel, 'EmpSearchResult', mFilters);
      },

      onSelectSuggestion(oEvent) {
        const oInput = oEvent.getSource();
        const oSelectedSuggestionRow = oEvent.getParameter('selectedRow');
        if (oSelectedSuggestionRow) {
          const oContext = oSelectedSuggestionRow.getBindingContext();
          oInput.setValue(oContext.getProperty('Pernr'));

          const oApprovalRequestModel = this.getApprovalRequestModel();
          const sRowPath = oInput.getParent().getBindingContext().getPath();
          oApprovalRequestModel.setProperty(`${sRowPath}/EnameA`, oContext.getProperty('Ename'));
          oApprovalRequestModel.setProperty(`${sRowPath}/OrgtxA`, oContext.getProperty('Fulln'));
          oApprovalRequestModel.setProperty(`${sRowPath}/ZzjikgbtA`, oContext.getProperty('Zzjikgbt'));
        }
        oInput.getBinding('suggestionRows').filter([]);
      },

      onSubmitSuggest(oEvent) {
        const oInput = oEvent.getSource();
        const oContext = oInput.getParent().getBindingContext();
        const sRowPath = oContext.getPath();
        const oApprovalRequestModel = this.getApprovalRequestModel();

        const sInputValue = oEvent.getParameter('value');
        if (!sInputValue) {
          oApprovalRequestModel.setProperty(`${sRowPath}/PernrA`, '');
          oApprovalRequestModel.setProperty(`${sRowPath}/EnameA`, '');
          oApprovalRequestModel.setProperty(`${sRowPath}/OrgtxA`, '');
          oApprovalRequestModel.setProperty(`${sRowPath}/ZzjikgbtA`, '');
          return;
        }

        const aEmployees = this.getConfigProperty('employees');
        const [mEmployee] = _.filter(aEmployees, (o) => _.startsWith(o.Pernr, sInputValue));

        if (sRowPath && !_.isEmpty(mEmployee)) {
          oApprovalRequestModel.setProperty(`${sRowPath}/PernrA`, mEmployee.Pernr);
          oApprovalRequestModel.setProperty(`${sRowPath}/EnameA`, mEmployee.Ename);
          oApprovalRequestModel.setProperty(`${sRowPath}/OrgtxA`, mEmployee.Fulln);
          oApprovalRequestModel.setProperty(`${sRowPath}/ZzjikgbtA`, mEmployee.Zzjikgbt);
        } else {
          oApprovalRequestModel.setProperty(`${sRowPath}/PernrA`, '');
          oApprovalRequestModel.setProperty(`${sRowPath}/EnameA`, '');
          oApprovalRequestModel.setProperty(`${sRowPath}/OrgtxA`, '');
          oApprovalRequestModel.setProperty(`${sRowPath}/ZzjikgbtA`, '');
        }
      },

      /**
       * 신청 정보 유효성 검사
       */
      validateRequestData() {
        const aToBeScheduleTableData = this.getDetailProperty('list');
        if (!_.every(aToBeScheduleTableData, 'PernrA')) {
          throw new UI5Error({ code: 'A', message: AppUtils.getBundleText('MSG_00005', 'LABEL_11006') }); // {근무자}를 선택하세요.
        }

        const sChgrsn = this.getDetailProperty('Chgrsn');
        if (!sChgrsn) {
          throw new UI5Error({ code: 'A', message: AppUtils.getBundleText('MSG_00003', 'LABEL_04013') }); // {변경사유}를 입력하세요.
        }
      },

      /**
       * 신청
       * @param {string} sPrcty - T:임시저장, C:신청
       * @returns
       */
      requestApproval({ sAppno, sPrcty = 'C' }) {
        const aDetailListData = this.getDetailProperty('list');
        const sChgrsn = this.getDetailProperty('Chgrsn');

        const oModel = this.oController.getModel(ServiceNames.WORKTIME);
        const mPayload = {
          Menid: this.oController.getCurrentMenuId(),
          Pernr: this.oController.getAppointeeProperty('Pernr'),
          Appno: sAppno,
          Prcty: sPrcty,
          Chgrsn: sChgrsn,
          OnCallChangeNav: aDetailListData.map((o) => ({ ...o, Chgrsn: sChgrsn })),
        };

        return Client.create(oModel, 'OnCallChangeApp', mPayload);
      },
    });
  }
);
