sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/EmployeeSearch',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    AppUtils,
    AttachFileAction,
    ComboEntry,
    EmployeeSearch,
    FragmentEvent,
    TableUtils,
    TextUtils,
    ServiceNames,
    ODataReadError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.medical.Medical', {
      AttachFileAction: AttachFileAction,
      EmployeeSearch: EmployeeSearch,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          detailName: this.isHass() ? 'h/medical-detail' : 'medical-detail',
          busy: false,
          Data: [],
          LoanType: [],
          parameters: {},
          search: {
            date: new Date(),
            secondDate: moment().startOf('year').hours(9).toDate(),
            Famgb: '',
            Famsa: '',
            Objps: '',
            Kdsvh: '',
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

      async onObjectMatched() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);
          const aList = await this.getFamilyCode();

          oListModel.setProperty('/FamilyCode', new ComboEntry({ codeKey: 'Famgb', valueKey: 'Znametx', aEntries: aList }));
          oListModel.setProperty('/search/Famgb', 'ALL');
          oListModel.setProperty('/search/Famsa', 'ALL');
          oListModel.setProperty('/search/Objps', 'ALL');
          oListModel.setProperty('/search/Kdsvh', 'ALL');

          this.onSearch();
          this.totalCount();
          // this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      onRefresh() {
        this.onSearch();
        this.totalCount();
        // this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
      },

      onClick() {
        this.getRouter().navTo(this.getViewModel().getProperty('/detailName'), { oDataKey: 'N' });
      },

      formatDate(sDate = '') {
        sDate = !sDate || sDate === '000000' ? '' : `${sDate.slice(0, 4)}.${sDate.slice(4, 6)}`;

        return sDate;
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR09';
      },

      formatNumber(vNum = '0') {
        return !vNum ? '0' : vNum;
      },

      formatPay(vPay = '0') {
        vPay = this.TextUtils.toCurrency(vPay);

        return vPay;
      },

      thisYear(sYear = String(moment().format('YYYY'))) {
        return this.getBundleText('MSG_09001', sYear);
      },

      async onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();
        const oSearch = oListModel.getProperty('/search');
        const dDate = moment(oSearch.secondDate).hours(9).toDate();
        const dDate2 = moment(oSearch.date).hours(9).toDate();
        const sMenid = this.getCurrentMenuId();
        let sFamgb = '';
        let sFamsa = '';
        let sObjps = '';
        let sKdsvh = '';

        oListModel.setProperty('/busy', true);

        if (!!oSearch.Famgb && oSearch.Famgb !== 'ALL') {
          sFamgb = oSearch.Famgb;
          sFamsa = oSearch.Famsa;
          sObjps = oSearch.Objps;
          sKdsvh = oSearch.Kdsvh;
        }

        const aFilters = [
          // prettier 방지주석
          new Filter('Prcty', FilterOperator.EQ, 'L'),
          new Filter('Menid', FilterOperator.EQ, sMenid),
          new Filter('Apbeg', FilterOperator.EQ, dDate),
          new Filter('Apend', FilterOperator.EQ, dDate2),
          new Filter('Famgb', FilterOperator.EQ, sFamgb),
          new Filter('Famsa', FilterOperator.EQ, sFamsa),
          new Filter('Objps', FilterOperator.EQ, sObjps),
          new Filter('Kdsvh', FilterOperator.EQ, sKdsvh),
        ];

        if (this.isHass()) {
          const sPernr = this.getAppointeeProperty('Pernr');

          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
          const aList = await this.getFamilyCode();
          oListModel.setProperty('/FamilyCode', new ComboEntry({ codeKey: 'Famgb', valueKey: 'Znametx', aEntries: aList }));
          oListModel.setProperty('/search/Famgb', 'ALL');
          oListModel.setProperty('/search/Famsa', 'ALL');
          oListModel.setProperty('/search/Objps', 'ALL');
          oListModel.setProperty('/search/Kdsvh', 'ALL');
        }

        oModel.read('/MedExpenseApplSet', {
          filters: aFilters,
          success: (oData) => {
            if (oData) {
              const aMedList = oData.results;
              const oTable = this.byId('medTable');

              oListModel.setProperty('/List', aMedList);
              oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aMedList, sStatCode: 'Lnsta' }));
            }
            oListModel.setProperty('/busy', false);
          },
          error: (oError) => {
            this.debug(oError);
            AppUtils.handleError(new ODataReadError(oError));
            oListModel.setProperty('/busy', false);
          },
        });
      },

      getFamilyCode() {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.BENEFIT);
          const aFilters = [new Filter('Datum', FilterOperator.EQ, new Date())];

          if (this.isHass()) {
            const sPernr = this.getAppointeeProperty('Pernr');

            aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
          }

          oModel.read('/MedExpenseSupportListSet', {
            filters: aFilters,
            success: (oData) => {
              if (oData) {
                resolve(oData.results);
              }
            },
            error: (oError) => {
              reject(oError);
            },
          });
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

        oModel.read('/MedExpenseMymedSet', {
          filters: aFilters,
          success: (oData) => {
            if (oData) {
              const oList = oData.results[0];

              oListModel.setProperty('/Total', oList);

              if (!!oList.Note) {
                oListModel.setProperty('/listInfo/infoMessage', oList.Note);
              }
            }
          },
          error: (oError) => {
            this.debug(oError);
            AppUtils.handleError(new ODataReadError(oError));
            oListModel.setProperty('/busy', false);
          },
        });
      },

      // 대상자 선택시
      onFamilyCode(oEvent) {
        const sKey = oEvent.getSource().getSelectedKey();
        const oViewModel = this.getViewModel();
        const oFCode = oViewModel.getProperty('/FamilyCode');

        oFCode.forEach((e) => {
          if (`${e.Famgb}${e.Famsa}${e.Objps}${e.Kdsvh}` === sKey) {
            oViewModel.setProperty('/search/Famgb', e.Famgb);
            oViewModel.setProperty('/search/Famsa', e.Famsa);
            oViewModel.setProperty('/search/Objps', e.Objps);
            oViewModel.setProperty('/search/Kdsvh', e.Kdsvh);
          } else if ('ALL' === sKey) {
            oViewModel.setProperty('/search/Famgb', '');
            oViewModel.setProperty('/search/Famsa', '');
            oViewModel.setProperty('/search/Objps', '');
            oViewModel.setProperty('/search/Kdsvh', '');
          }
        });
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);

        this.getRouter().navTo(oListModel.getProperty('/detailName'), { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('medTable');
        const aTableData = this.getViewModel().getProperty('/List');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_09010');

        TableUtils.export({ oTable, aTableData, sFileName, sStatCode: 'Lnsta', sStatTxt: 'Lnstatx' });
      },
    });
  }
);
