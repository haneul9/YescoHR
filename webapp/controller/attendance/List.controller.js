sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/common/EmpInfo',
    '../../model/formatter',
    'sap/ui/yesco/extension/moment',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    BaseController,
    EmpInfo,
    formatter
  ) => {
    'use strict';

    class List extends BaseController {
      constructor() {
        super();
        this.formatter = formatter;
      }

      onInit() {
        const oViewModel = new JSONModel({
          search: {
            Apbeg: moment().subtract(1, 'month').startOf('month').hours(9).toDate(),
            Apend: moment().hours(9).toDate(),
          },
          listinfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
          list: [],
        });
        // oViewModel.loadData('localService/attendancedata.json');
        this.setViewModel(oViewModel);

        // 대상자 정보
        EmpInfo.getInfo.call(this, 'o');

        // 목록 조회
        this.search();
      }

      search() {
        const oModel = this.getModel('worktime');
        const oViewModel = this.getViewModel();
        const oSearchConditions = oViewModel.getProperty('/search');

        oModel.read('/LeaveApplContentSet', {
          filters: [
            new Filter('Apbeg', FilterOperator.EQ, oSearchConditions.Apbeg), //
            new Filter('Apend', FilterOperator.EQ, oSearchConditions.Apend),
          ],
          success: (oData) => {
            this.debug('success.', oData);
            oViewModel.setProperty('/list', oData.results);
            oViewModel.setProperty('/listinfo/rowCount', oData.results.length > 10 ? 10 : oData.results.length || 1);
            oViewModel.setProperty('/listinfo/totalCount', oData.results.length);
          },
          error: (oError) => {
            this.debug(`${sUrl} error.`, oError);
          },
        });
      }
    }

    return List;
  }
);
