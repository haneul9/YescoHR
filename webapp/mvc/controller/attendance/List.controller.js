sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/ODataDate',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    MessageBox,
    ODataReadError,
    ServiceNames,
    TableUtils,
    BaseController,
    ODataDate
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.attendance.List', {
      TableUtils: TableUtils,
      type: {
        ODataDate: new ODataDate(),
      },

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          isVisibleActionButton: false,
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
          parameter: {
            selectedIndices: [],
            rowData: [],
          },
        });
        this.setViewModel(oViewModel);
      },

      onAfterShow() {
        // ! 필수 호출 - BaseController.onPageLoaded
        this.onPageLoaded();

        this.initialRetrieve();
      },

      async initialRetrieve() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const sPernr = this.getOwnerComponent().getSessionModel().getProperty('/Pernr');
        const oSearchConditions = oViewModel.getProperty('/search');

        try {
          oViewModel.setProperty('/busy', true);

          const [mQuotaResultData, mRowData] = await Promise.all([
            this.readAbsQuotaList({ oModel, sPernr }), //
            this.readLeaveApplContent({ oModel, oSearchConditions }),
          ]);

          setTimeout(() => {
            this.setTableData({ oViewModel, mRowData });
          }, 100);

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
          this.debug('Controller > Attendance List > initialRetrieve Error', oError);

          if (oError instanceof Error) {
            MessageBox.error(oError.message);
          } else if (oError instanceof sap.ui.yesco.common.exceptions.Error) {
            oError.showErrorMessage();
          }
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTableData({ oViewModel, mRowData }) {
        const oTable = this.byId('attendanceTable');

        oViewModel.setProperty(
          '/list',
          mRowData.map((o) => {
            return {
              ...o,
              Pernr: parseInt(o.Pernr, 10),
              BegdaTxt: o.Begda ? moment(new Date(o.Begda)).hours(9).format('YYYY.MM.DD') : '',
              EnddaTxt: o.Endda ? moment(new Date(o.Endda)).hours(9).format('YYYY.MM.DD') : '',
              AppdtTxt: o.Appdt ? moment(new Date(o.Appdt)).hours(9).format('YYYY.MM.DD') : '',
              SgndtTxt: o.Sgndt ? moment(new Date(o.Sgndt)).hours(9).format('YYYY.MM.DD') : '',
            };
          })
        );
        oViewModel.setProperty('/listInfo', TableUtils.count({ oTable, mRowData }));
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onPressSearch() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const oSearchConditions = oViewModel.getProperty('/search');

        try {
          oViewModel.setProperty('/busy', true);

          const mRowData = await this.readLeaveApplContent({ oModel, oSearchConditions });

          this.setTableData({ oViewModel, mRowData });
        } catch (oError) {
          this.debug('Controller > Attendance List > onPressSearch Error', oError);

          if (oError instanceof Error) {
            MessageBox.error(oError.message);
          } else if (oError instanceof sap.ui.yesco.common.exceptions.Error) {
            oError.showErrorMessage();
          }
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onPressExcelDownload() {
        const oTable = this.byId('attendanceTable');
        const mTableData = this.getViewModel().getProperty('/list');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_04001'); // {근태신청}_목록

        TableUtils.export({ oTable, mTableData, sFileName });
      },

      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(sPath);

        oViewModel.setProperty('/parameter/rowData', [oRowData]);
        this.getRouter().navTo('attendance-detail', { type: oRowData.Appty, appno: oRowData.Appno });
      },

      onChangeRowSelection(oEvent) {
        const oTable = oEvent.getSource();
        const oViewModel = this.getViewModel();
        const aSelectedIndices = oTable.getSelectedIndices();

        oViewModel.setProperty('/parameter/rowData', []);
        oViewModel.setProperty('/parameter/selectedIndices', aSelectedIndices);

        if (!aSelectedIndices.length) {
          oViewModel.setProperty('/isVisibleActionButton', false);
        } else {
          oViewModel.setProperty(
            '/isVisibleActionButton',
            !aSelectedIndices.some((idx) => {
              const sRowPath = oTable.getRows()[idx].getBindingContext().getPath();
              const oRowData = oViewModel.getProperty(sRowPath);

              return oRowData.ZappStatAl !== '10';
            })
          );
        }
      },

      setRowActionParameters() {
        const oViewModel = this.getViewModel();
        const oTable = this.byId('attendanceTable');
        const aSelectedIndices = oViewModel.getProperty('/parameter/selectedIndices');

        oViewModel.setProperty(
          '/parameter/rowData',
          aSelectedIndices.map((idx) => {
            const sRowPath = oTable.getRows()[idx].getBindingContext().getPath();
            const oRowData = oViewModel.getProperty(sRowPath);

            return oRowData;
          })
        );
      },

      onPressNewApprovalBtn() {
        this.getRouter().navTo('attendance-detail', { type: 'A' });
      },

      onPressModApprovalBtn() {
        this.setRowActionParameters();
        this.getRouter().navTo('attendance-detail', { type: 'B' });
      },

      onPressCancApprovalBtn() {
        this.setRowActionParameters();
        this.getRouter().navTo('attendance-detail', { type: 'C' });
      },

      onSuggest(oEvent) {
        const oModel = this.getModel(ServiceNames.COMMON);
        const oControl = oEvent.getSource();
        const sValue = oEvent.getParameter('suggestValue');

        oControl.destroySuggestionItems();

        oModel.read('/EmpSearchResultSet', {
          filters: [
            new Filter('Persa', FilterOperator.EQ, '1000'), //
            new Filter('Short', FilterOperator.EQ, 'X'),
            new Filter('Ename', FilterOperator.EQ, sValue),
          ],
          success: (oData) => {
            oData.results.forEach((o) => {
              oControl.addSuggestionItem(new sap.ui.core.ListItem({ text: o.Ename, additionalText: o.Fulln, key: o.Pernr }));
            });
          },
          error: (oError) => {
            this.debug(oError);
          },
        });
      },

      onSelectSuggest(oEvent) {
        const oControl = oEvent.getSource();
        this.debug(oControl);
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
      /**
       * @param  {JSONModel} oModel
       * @param  {String} sPernr
       */
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

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      /**
       * @param  {JSONModel} oModel
       * @param  {Object} oSearchConditions
       */
      readLeaveApplContent({ oModel, oSearchConditions }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/LeaveApplContentSet';
          const sMenid = this.getOwnerComponent().getMenuModel().getCurrentMenuId();

          oModel.read(sUrl, {
            filters: [
              new Filter('Menid', FilterOperator.EQ, sMenid), //
              new Filter('Apbeg', FilterOperator.EQ, moment(oSearchConditions.Apbeg).hours(9).toDate()),
              new Filter('Apend', FilterOperator.EQ, moment(oSearchConditions.Apend).hours(9).toDate()),
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },
    });
  }
);
