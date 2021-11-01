sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/extension/moment',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    BaseController,
    EmpInfo,
    TableUtils
  ) => {
    'use strict';

    class List extends BaseController {
      constructor() {
        super();
        this.formatter = TableUtils;
      }

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          search: {
            Apbeg: moment().subtract(1, 'month').add(1, 'day').hours(9).toDate(),
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
        const bTargetChangeButtonHide = true;
        EmpInfo.get.call(this, { bTargetChangeButtonHide });

        // 목록 조회
        this.search();
      }

      search() {
        const oModel = this.getModel('worktime');
        const oViewModel = this.getViewModel();
        const oSearchConditions = oViewModel.getProperty('/search');
        const sUrl = '/LeaveApplContentSet';

        oViewModel.setProperty('/busy', true);

        oModel.read(sUrl, {
          filters: [
            new Filter('Apbeg', FilterOperator.EQ, moment(oSearchConditions.Apbeg).hours(9).toDate()), //
            new Filter('Apend', FilterOperator.EQ, moment(oSearchConditions.Apend).hours(9).toDate()),
          ],
          success: (oData) => {
            oViewModel.setProperty('/list', oData.results);
            TableUtils.count.call(this, oData.results);

            oViewModel.setProperty('/busy', false);
          },
          error: (oError) => {
            this.debug(`${sUrl} error.`, oError);

            oViewModel.setProperty('/busy', false);
          },
        });
      }

      onExelDownload() {
        const oTable = this.byId('attendanceTable');
        const mTableData = this.getViewModel().getProperty('/list');
        const sFileName = '근태신청_목록';

        TableUtils.export({ oTable, mTableData, sFileName });
      }
    }

    return List;
  }
);
