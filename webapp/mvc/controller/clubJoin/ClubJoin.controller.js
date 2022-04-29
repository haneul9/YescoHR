sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    AppUtils,
    ServiceNames,
    ODataReadError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.clubJoin.ClubJoin', {
      initializeModel() {
        return {
          detailName: this.isHass() ? 'h/clubJoin-detail' : 'clubJoin-detail',
          busy: false,
          Data: [],
          LoanType: [],
          search: {
            date: moment().endOf('year').hours(9).toDate(),
            secondDate: moment().startOf('year').hours(9).toDate(),
          },
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
        };
      },

      onObjectMatched() {
        this.totalCount();
        this.onSearch();
        this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
      },

      // 대상자 정보 사원선택시 화면 Refresh
      callbackAppointeeChange() {
        this.totalCount();
        this.onSearch();
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR07';
      },

      onClick() {
        this.getRouter().navTo(this.getViewModel().getProperty('/detailName'), { oDataKey: 'N' });
      },

      thisYear(sYear = String(moment().format('YYYY'))) {
        return this.getBundleText('MSG_14001', sYear);
      },

      formatNumber(vNum = '0') {
        return parseInt(vNum);
      },

      formatPay(vPay = '0') {
        return this.TextUtils.toCurrency(vPay);
      },

      onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();
        const oTable = this.byId('clubTable');
        const oSearch = oListModel.getProperty('/search');
        const dDate = moment(oSearch.secondDate).hours(9).toDate();
        const dDate2 = moment(oSearch.date).hours(9).toDate();
        const sMenid = this.getCurrentMenuId();
        const aFilters = [
          // prettier 방지주석
          new Filter('Prcty', FilterOperator.EQ, 'L'),
          new Filter('Menid', FilterOperator.EQ, sMenid),
          new Filter('Apbeg', FilterOperator.EQ, dDate),
          new Filter('Apend', FilterOperator.EQ, dDate2),
        ];

        oListModel.setProperty('/busy', true);

        if (this.isHass()) {
          const sPernr = this.getAppointeeProperty('Pernr');

          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
        }

        oModel.read('/ClubJoinApplSet', {
          filters: aFilters,
          success: (oData) => {
            if (oData) {
              const oList = oData.results;

              oListModel.setProperty('/List', oList);
              oListModel.setProperty('/listInfo', this.TableUtils.count({ oTable, aRowData: oList, sStatCode: 'Lnsta' }));
              oListModel.setProperty('/listInfo/Title', this.getBundleText('LABEL_14006'));
              oListModel.setProperty('/busy', false);
            }
          },
          error: (oError) => {
            this.debug(oError);
            AppUtils.handleError(new ODataReadError(oError));
            oListModel.setProperty('/busy', false);
          },
        });
      },

      totalCount() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();
        const aFilters = [];

        if (this.isHass()) {
          const sPernr = this.getAppointeeProperty('Pernr');

          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
        }

        oModel.read('/ClubJoinMyclubSet', {
          filters: aFilters,
          success: (oData) => {
            if (oData) {
              const oList = oData.results[0];

              oListModel.setProperty('/Total', oList);
            }
          },
          error: (oError) => {
            this.debug(oError);
            AppUtils.handleError(new ODataReadError(oError));
            oListModel.setProperty('/busy', false);
          },
        });
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);

        oListModel.setProperty('/parameters', oRowData);
        this.getRouter().navTo(oListModel.getProperty('/detailName'), { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('clubTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_14014');

        this.TableUtils.export({ oTable, sFileName, sStatCode: 'Lnsta', sStatTxt: 'Lnstatx' });
      },
    });
  }
);
