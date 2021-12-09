sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils
  ) => {
    'use strict';

    return (oController) => {
      return {
        /**
         *
         */
        setDefaultViewModel() {
          const oTodayMoment = moment().hours(9);
          const oTodayDate = oTodayMoment.toDate();

          const oViewModel = new JSONModel({
            busy: true,
            isVisibleActionButton: false,
            summary: {
              Year: oTodayMoment.format('YYYY'),
              YearMonth: oController.getBundleText('MSG_06002', oTodayMoment.format('YYYY'), oTodayMoment.format('M')),
            },
            search: {
              Apend: oTodayDate,
              Apbeg: oTodayMoment.subtract(1, 'month').add(1, 'day').toDate(),
              nightshiftNames: [],
              nightshiftTypes: [],
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
            dialog: {
              search: {
                month: oTodayDate,
              },
            },
          });

          oController.setViewModel(oViewModel);

          return this;
        },

        /**
         *
         */
        async retrieveSearchConditionSet() {
          try {
            this.retreiveNightshiftNames();
            this.retreiveNightshiftTypes();
          } catch (oError) {
            oController.debug('Controller > Nightshift List > retrieveSearchConditionSet Error', oError);

            AppUtils.handleError(oError);
          } finally {
            oController.setPageBusy(false);
          }

          return this;
        },

        /**
         *
         */
        retreiveNightshiftNames() {
          setTimeout(() => {
            this.setNightshiftNames([
              { value: 'A', text: 'A' },
              { value: 'B', text: 'B' },
            ]);
          }, Math.random() * 10000);

          // const sUrl = '/OnCallSummarySet';

          // oController.getModel(ServiceNames.WORKTIME).read(sUrl, {
          //   filters: [
          //     new Filter('Pernr', FilterOperator.EQ, sPernr), //
          //   ],
          //   success: (mData) => {
          //     oController.debug(`${sUrl} success.`, mData);

          //     Promise.resolve(mData.results);
          //   },
          //   error: (oError) => {
          //     oController.debug(`${sUrl} error.`, oError);

          //     Promise.reject(new ODataReadError(oError));
          //   },
          // });
        },

        /**
         *
         */
        setNightshiftNames(aNightshiftNames) {
          oController.getViewModel().setProperty('/search/nightshiftNames', aNightshiftNames);
        },

        /**
         *
         */
        async retreiveNightshiftTypes() {
          setTimeout(() => {
            Promise.resolve([
              { value: '평일야간', text: '평일야간' },
              { value: '주말야간', text: '주말야간' },
            ]);
          }, Math.random() * 10000);

          // const sUrl = '/OnCallSummarySet';

          // oController.getModel(ServiceNames.WORKTIME).read(sUrl, {
          //   filters: [
          //     new Filter('Pernr', FilterOperator.EQ, sPernr), //
          //   ],
          //   success: (mData) => {
          //     oController.debug(`${sUrl} success.`, mData);

          //     Promise.resolve(mData.results);
          //   },
          //   error: (oError) => {
          //     oController.debug(`${sUrl} error.`, oError);

          //     Promise.reject(new ODataReadError(oError));
          //   },
          // });
        },

        /**
         *
         */
        setNightshiftTypes(aNightshiftTypes) {
          oController.getViewModel().setProperty('/search/nightshiftTypes', aNightshiftTypes);
        },
      };
    };
  }
);
