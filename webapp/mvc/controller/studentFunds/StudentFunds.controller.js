sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    AttachFileAction,
    TableUtils,
    TextUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.studentFunds.StudentFunds', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,

      initializeModel() {
        return {
          routeName: '',
          detailName: this.isHass() ? 'h/studentFunds-detail' : 'studentFunds-detail',
          busy: false,
          Data: [],
          StudentList: [],
          searchDate: {
            date: moment().hours(9).toDate(),
            secondDate: moment().subtract(1, 'month').add(1, 'day').hours(9).toDate(),
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

      async onObjectMatched(oParameter, sRouteName) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/routeName', sRouteName);

        try {
          oViewModel.setProperty('/busy', true);

          const aList = await this.getStudentFundList();
          const oTable = this.byId('studentTable');

          oViewModel.setProperty('/StudentList', aList);
          oViewModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aList }));

          const [mTotal] = await this.totalCount();
          const sYear = mTotal.Zyear;

          mTotal.Zbetrg = mTotal.Zbetrg.replace(/\./g, '');
          mTotal.Zyear = sYear === '0000' ? moment().format('YYYY') : sYear;

          oViewModel.setProperty('/Total', mTotal);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      async callbackAppointeeChange() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const aList = await this.getStudentFundList();
          const oTable = this.byId('studentTable');

          oViewModel.setProperty('/StudentList', aList);
          oViewModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aList }));

          const [mTotal] = await this.totalCount();
          const sYear = mTotal.Zyear;

          mTotal.Zbetrg = mTotal.Zbetrg.replace(/\./g, '');
          mTotal.Zyear = sYear === '0000' ? moment().format('YYYY') : sYear;

          oViewModel.setProperty('/Total', mTotal);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR02';
      },

      onClick() {
        this.getRouter().navTo(`${this.getViewModel().getProperty('/routeName')}-detail`, { oDataKey: 'N' });
      },

      formatNumber(vNum = '0') {
        return vNum;
      },

      formatPay(vPay = '0') {
        return TextUtils.toCurrency(vPay);
      },

      thisYear(sYear = String(moment().format('YYYY'))) {
        return this.getBundleText('MSG_03012', sYear); // {0}년 학자금 신청 내역입니다.
      },

      async onSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const aList = await this.getStudentFundList();
          const oTable = this.byId('studentTable');

          oViewModel.setProperty('/StudentList', aList);
          oViewModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aList }));

          const [mTotal] = await this.totalCount();
          const sYear = mTotal.Zyear;

          mTotal.Zbetrg = mTotal.Zbetrg.replace(/\./g, '');
          mTotal.Zyear = sYear === '0000' ? moment().format('YYYY') : sYear;

          oViewModel.setProperty('/Total', mTotal);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 학자금 신청내역
      async getStudentFundList() {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const mSearch = oViewModel.getProperty('/searchDate');
        const dDate = moment(mSearch.secondDate).hours(9).toDate();
        const dDate2 = moment(mSearch.date).hours(9).toDate();
        const sMenid = this.getCurrentMenuId();
        const mPayLoad = {
          Prcty: 'L',
          Menid: sMenid,
          Apbeg: dDate,
          Apend: dDate2,
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        return await Client.getEntitySet(oModel, 'SchExpenseAppl', mPayLoad);
      },

      // 나의 학자금 현황
      async totalCount() {
        const oModel = this.getModel(ServiceNames.BENEFIT);

        return await Client.getEntitySet(oModel, 'SchExpenseMysch', { Pernr: this.getAppointeeProperty('Pernr') });
      },

      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = oViewModel.getProperty(vPath);

        this.getRouter().navTo(oViewModel.getProperty('/detailName'), { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('studentTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_03028'); // {학자금 신청}_목록

        TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
