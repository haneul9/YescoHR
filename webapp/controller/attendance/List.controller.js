sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/control/MessageBox',
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
    MessageBox,
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

        this.initialRetrieve();
      }

      async initialRetrieve() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        // const sPernr = oViewModel.getProperty('/TargetInfo/Pernr');
        const sPernr = '50013';
        const oSearchConditions = oViewModel.getProperty('/search');

        try {
          oViewModel.setProperty('/busy', true);

          const [mQuotaResultData, mResultListData] = await Promise.all([
            this.readAbsQuotaList({ oModel, sPernr }), //
            this.readLeaveApplContent({ oModel, oSearchConditions }),
          ]);

          oViewModel.setProperty('/list', mResultListData);
          TableUtils.count.call(this, mResultListData);

          oViewModel.setProperty(
            '/quota',
            _.reduce(
              mQuotaResultData,
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
        } catch (oError) {
          MessageBox.error(this.getText('MSG_00008', '조회'));
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      }

      /*****************************************************************
       * Event handler
       *****************************************************************/
      async onPressSearch() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const oSearchConditions = oViewModel.getProperty('/search');

        try {
          oViewModel.setProperty('/busy', true);

          const mResultData = await this.readLeaveApplContent({ oModel, oSearchConditions });

          oViewModel.setProperty('/list', mResultData);
          TableUtils.count.call(this, mResultData);
        } catch (error) {
          MessageBox.error(this.getText('MSG_00008', '조회'));
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      }

      onPressExcelDownload() {
        const oTable = this.byId('attendanceTable');
        const mTableData = this.getViewModel().getProperty('/list');
        const sFileName = '근태신청_목록';

        TableUtils.export({ oTable, mTableData, sFileName });
      }

      onPressNewApprovalBtn() {
        this.getRouter().navTo('attendance-detail', { type: 'n' });
      }

      onPressModApprovalBtn() {
        this.getRouter().navTo('attendance-detail', { type: 'm' });
      }

      onPressCancApprovalBtn() {
        this.getRouter().navTo('attendance-detail', { type: 'c' });
      }

      /*****************************************************************
       * Call oData
       *****************************************************************/
      readAbsQuotaList({ oModel, sPernr }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/AbsQuotaListSet';

          oModel.read(sUrl, {
            filters: [
              new Filter('Pernr', FilterOperator.EQ, sPernr), //
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);
              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);
              reject(oError);
            },
          });
        });
      }

      readLeaveApplContent({ oModel, oSearchConditions }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/LeaveApplContentSet';

          oModel.read(sUrl, {
            filters: [
              new Filter('Apbeg', FilterOperator.EQ, moment(oSearchConditions.Apbeg).hours(9).toDate()), //
              new Filter('Apend', FilterOperator.EQ, moment(oSearchConditions.Apend).hours(9).toDate()),
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);
              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);
              reject(oError);
            },
          });
        });
      }
    }

    return List;
  }
);
