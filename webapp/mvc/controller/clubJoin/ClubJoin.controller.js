sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.clubJoin.ClubJoin', {
      initializeModel() {
        return {
          routeName: '',
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

      async onObjectMatched(oParameter, sRouteName) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/routeName', sRouteName);

        try {
          this.totalCount();
          this.onSearch();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      callbackAppointeeChange() {
        try {
          this.totalCount();
          this.onSearch();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR07';
      },

      onClick() {
        this.getRouter().navTo(`${this.getViewModel().getProperty('/routeName')}-detail`, { oDataKey: 'N' });
      },

      thisYear(sYear = String(moment().format('YYYY'))) {
        // {0}년 현재 가입된 내역입니다.
        return this.getBundleText('MSG_14001', sYear);
      },

      formatNumber(vNum = '0') {
        return parseInt(vNum);
      },

      formatPay(vPay = '0') {
        return this.TextUtils.toCurrency(vPay);
      },

      async onSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const mSearch = oViewModel.getProperty('/search');
          const dDate = moment(_.get(mSearch, 'secondDate')).hours(9).toDate();
          const dDate2 = moment(_.get(mSearch, 'date')).hours(9).toDate();
          const sMenid = this.getCurrentMenuId();
          const oModel = this.getModel(ServiceNames.BENEFIT);
          const oList = await Client.getEntitySet(oModel, 'ClubJoinAppl', {
            Prcty: 'L',
            Menid: sMenid,
            Apbeg: dDate,
            Apend: dDate2,
            Pernr: this.getAppointeeProperty('Pernr'),
          });

          const oTable = this.byId('clubTable');

          oViewModel.setProperty('/List', oList);
          oViewModel.setProperty('/listInfo', this.TableUtils.count({ oTable, aRowData: oList, sStatCode: 'Lnsta' }));
          oViewModel.setProperty('/listInfo/Title', this.getBundleText('LABEL_14006')); // 가입/신청 내역
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async totalCount() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();
        const [oTotal] = await Client.getEntitySet(oModel, 'ClubJoinMyclub', { Pernr: this.getAppointeeProperty('Pernr') });

        oViewModel.setProperty('/Total', oTotal);
      },

      onSelectRow(oEvent) {
        const sPath = oEvent.getParameter('rowBindingContext').getPath();
        const oViewModel = this.getViewModel();
        const mRowData = oViewModel.getProperty(sPath);

        oViewModel.setProperty('/parameters', mRowData);
        this.getRouter().navTo(`${oViewModel.getProperty('/routeName')}-detail`, { oDataKey: _.get(mRowData, 'Appno') });
      },

      onPressExcelDownload() {
        const oTable = this.byId('clubTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_14014'); // {동호회 가입신청}_목록

        this.TableUtils.export({ oTable, sFileName, sStatCode: 'Lnsta', sStatTxt: 'Lnstatx' });
      },
    });
  }
);
