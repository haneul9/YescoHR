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

    return {
      init(oController) {
        this.oController = oController;
        return this;
      },

      /**
       *
       */
      setDefaultViewModel() {
        const oTodayMoment = moment().hours(9);
        const oTodayDate = oTodayMoment.toDate();

        const oViewModel = new JSONModel({
          busy: true,
          isVisibleActionButton: false,
          search: {
            Apend: oTodayDate,
            Apbeg: oTodayMoment.subtract(1, 'month').add(1, 'day').toDate(),
            nightdutyNames: [],
            nightdutyTypes: [],
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
              month: oTodayDate.getMonth(),
            },
          },
        });

        this.oController.setViewModel(oViewModel);

        return this;
      },

      /**
       *
       */
      async retrieveSearchConditionSet() {
        try {
          this.retreiveNightdutyNames();
          this.retreiveNightdutyTypes();
        } catch (oError) {
          this.oController.debug('Controller > Nightduty List > retrieveSearchConditionSet Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.oController.setPageBusy(false);
        }

        return this;
      },

      /**
       *
       */
      retreiveNightdutyNames() {
        setTimeout(() => {
          this.setNightdutyNames([
            { value: 'A', text: 'A' },
            { value: 'B', text: 'B' },
          ]);
        }, Math.random() * 10000);

        // const sUrl = '/OnCallSummarySet';

        // this.oController.getModel(ServiceNames.WORKTIME).read(sUrl, {
        //   filters: [
        //     new Filter('Pernr', FilterOperator.EQ, sPernr), //
        //   ],
        //   success: (mData) => {
        //     this.oController.debug(`${sUrl} success.`, mData);

        //     Promise.resolve(mData.results);
        //   },
        //   error: (oError) => {
        //     this.oController.debug(`${sUrl} error.`, oError);

        //     Promise.reject(new ODataReadError(oError));
        //   },
        // });
      },

      /**
       *
       */
      setNightdutyNames(aNightdutyNames) {
        this.oController.getViewModel().setProperty('/search/nightdutyNames', aNightdutyNames);
      },

      /**
       *
       */
      async retreiveNightdutyTypes() {
        setTimeout(() => {
          Promise.resolve([
            { value: '평일야간', text: '평일야간' },
            { value: '주말야간', text: '주말야간' },
          ]);
        }, Math.random() * 10000);

        // const sUrl = '/OnCallSummarySet';

        // this.oController.getModel(ServiceNames.WORKTIME).read(sUrl, {
        //   filters: [
        //     new Filter('Pernr', FilterOperator.EQ, sPernr), //
        //   ],
        //   success: (mData) => {
        //     this.oController.debug(`${sUrl} success.`, mData);

        //     Promise.resolve(mData.results);
        //   },
        //   error: (oError) => {
        //     this.oController.debug(`${sUrl} error.`, oError);

        //     Promise.reject(new ODataReadError(oError));
        //   },
        // });
      },

      /**
       *
       */
      setNightdutyTypes(aNightdutyTypes) {
        this.oController.getViewModel().setProperty('/search/nightdutyTypes', aNightdutyTypes);
      },
    };
  }
);
