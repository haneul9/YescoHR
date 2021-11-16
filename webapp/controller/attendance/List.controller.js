sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/extension/moment',
    'sap/ui/yesco/extension/lodash',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    BaseController,
    ServiceNames,
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
          navigation: {
            current: '근태신청',
            links: [
              { name: '근태' }, //
            ],
          },
          quota: {},
          search: {
            Apbeg: moment().subtract(1, 'month').add(1, 'day').hours(9).toDate(),
            Apend: moment().hours(9).toDate(),
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
          list: [],
        });
        this.setViewModel(oViewModel);

        // 대상자 정보
        const bTargetChangeButtonHide = true;
        EmpInfo.get.call(this, { bTargetChangeButtonHide });

        // 휴가쿼터 조회
        this.retrieveQuota();

        // 목록 조회
        this.search();
      }

      retrieveQuota() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const sUrl = '/AbsQuotaListSet';
        // const sPernr = oViewModel.getProperty('/TargetInfo/Pernr');
        const sPernr = '50013';

        oModel.read(sUrl, {
          filters: [
            new Filter('Pernr', FilterOperator.EQ, sPernr), //
          ],
          success: (oData) => {
            this.debug(`${sUrl} success.`, oData);

            oViewModel.setProperty(
              '/quota',
              _.reduce(
                oData.results,
                (acc, { Ktart, Kotxt, Crecnt, Usecnt }) => ({
                  ...acc,
                  [Ktart]: {
                    Kotxt,
                    Crecnt: parseInt(Crecnt, 10),
                    Usecnt: parseInt(Usecnt, 10),
                    Rate: (parseInt(Usecnt, 10) / parseInt(Crecnt, 10)) * 100,
                  },
                }),
                {}
              )
            );
          },
          error: (oError) => {
            this.debug(`${sUrl} error.`, oError);
          },
        });
      }

      search() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
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

      onPressNewApprBtn() {
        this.getRouter().navTo('attendance-detail', { type: 'n' });
      }

      onPressModApprBtn() {
        this.getRouter().navTo('attendance-detail', { type: 'm' });
      }

      onPressCancApprBtn() {
        this.getRouter().navTo('attendance-detail', { type: 'c' });
      }
    }

    return List;
  }
);
