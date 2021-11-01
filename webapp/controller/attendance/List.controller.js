sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/export/library',
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
    exportLibrary,
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

      onInit() {
        const oViewModel = new JSONModel({
          busy: false,
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
        const sUrl = '/LeaveApplContentSet';

        oViewModel.setProperty('/busy', true);

        oModel.read(sUrl, {
          filters: [
            new Filter('Apbeg', FilterOperator.EQ, moment(oSearchConditions.Apbeg).hours(9).toDate()), //
            new Filter('Apend', FilterOperator.EQ, moment(oSearchConditions.Apend).hours(9).toDate()),
          ],
          success: (oData) => {
            oViewModel.setProperty('/list', oData.results);
            TableUtils.count.call(this, { mTableData: oData.results });

            oViewModel.setProperty('/busy', false);
          },
          error: (oError) => {
            this.debug(`${sUrl} error.`, oError);

            oViewModel.setProperty('/busy', false);
          },
        });
      }

      createColumnConfig() {
        const aCols = [
          { label: '상태', property: 'ZappStxtAl', type: exportLibrary.EdmType.String },
          { label: '구분', property: 'Dettx', type: exportLibrary.EdmType.String },
          { label: '사번', property: 'Appernr', type: exportLibrary.EdmType.String },
          { label: '성명', property: 'Apename', type: exportLibrary.EdmType.String },
          { label: '부서', property: 'Aporgtx', type: exportLibrary.EdmType.String },
          { label: '직급', property: 'Apzzjikgbtx', type: exportLibrary.EdmType.String },
          { label: '근태', property: 'Atext', type: exportLibrary.EdmType.String },
          { label: '시작일', property: 'Apbeg', type: exportLibrary.EdmType.Date },
          { label: '종료일', property: 'Apend', type: exportLibrary.EdmType.Date },
          { label: '기간', property: 'Period', type: exportLibrary.EdmType.String },
          { label: '신청일', property: 'Appdt', type: exportLibrary.EdmType.Date },
          { label: '결재일', property: 'Sgndt', type: exportLibrary.EdmType.Date },
        ];

        return aCols;
      }

      onExelDownload() {
        const aColumns = this.createColumnConfig();
        const mTableData = this.getViewModel().getProperty('/list');
        const sFileName = '근태신청_목록';

        TableUtils.export({ aColumns, mTableData, sFileName });
      }
    }

    return List;
  }
);
