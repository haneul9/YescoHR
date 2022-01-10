sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    AppUtils,
    Client,
    ServiceNames,
    UI5Error,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.leavePlan.App', {
      onBeforeShow() {
        const today = moment();
        const oViewModel = new JSONModel({
          busy: false,
          search: {
            year: today.format('YYYY'),
            Todo1: '1',
          },
          entry: {
            Todo1List: [
              { Zcode: '1', Ztext: '1' },
              { Zcode: '2', Ztext: '2' },
              { Zcode: '3', Ztext: '3' },
              { Zcode: '4', Ztext: '4' },
            ],
          },
          summary: {
            rangeTxt: '(2022.01.01~2022.01.31)',
            quota: [
              { Todo1: '연차휴가', Todo2: 52, Todo3: 40 },
              { Todo1: '하계휴가', Todo2: 20, Todo3: 5 },
              { Todo1: '휴가계획', Todo2: 20, Todo3: 5 },
            ],
          },
        });
        this.setViewModel(oViewModel);
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
        } catch (oError) {
          this.debug('Controller > leavePlan App > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const mFilters = oViewModel.getProperty('/search');
          const fCurried = Client.getEntitySet(this.getModel(ServiceNames.WORKTIME));
          const [aSummary, aRowData] = await Promise.all([
            fCurried('LeaveUseHistory', { ...mFilters }), //
            fCurried('LeaveUseBoard', { ...mFilters }),
          ]);

          this.setTableData({ oViewModel, aRowData });

          const mGroupByOyymm = _.chain(aSummary)
            .groupBy('Oyymm')
            .defaults({ ..._.times(12, (v) => ({ [`${this.getBundleText('LABEL_16019', v + 1)}`]: [{ [this.CHARTS.ACC.prop]: 0, [this.CHARTS.CUR.prop]: 0 }] })).reduce((acc, cur) => ({ ...acc, ...cur }), {}) })
            .value();

          const iCurrentMonthIndex = moment(mFilters.Zyymm).month() + 1;
          const mVerticalLineMonth = {
            vline: 'true',
            lineposition: '0',
            color: '#6baa01',
            labelHAlign: 'center',
            labelPosition: '0',
            // label: 'Selected Month',
            dashed: '1',
          };

          oViewModel.setProperty(
            '/summary/categories/0/category',
            _.chain(aSummary)
              .reduce((acc, cur) => [...acc, { label: cur.Oyymm }], [])
              .defaults(_.times(12, (v) => ({ label: this.getBundleText('LABEL_16019', v + 1) })))
              .tap((arr) => arr.splice(iCurrentMonthIndex, 0, mVerticalLineMonth))
              .value()
          );
          oViewModel.setProperty('/summary/dataset', [
            {
              seriesname: this.getBundleText(this.CHARTS.ACC.label),
              anchorBorderColor: this.CHARTS.ACC.color,
              anchorBgColor: this.CHARTS.ACC.color,
              data: _.chain(mGroupByOyymm)
                .map((v) => ({ value: _.get(v, [0, this.CHARTS.ACC.prop]) }))
                .forEach((v, i, o) => {
                  if (_.isEqual(v.value, 0)) v.value = _.get(o, [i - 1, 'value'], 0);
                })
                .value(),
            },
            {
              seriesname: this.getBundleText(this.CHARTS.CUR.label),
              anchorBorderColor: this.CHARTS.CUR.color,
              anchorBgColor: this.CHARTS.CUR.color,
              data: _.map(mGroupByOyymm, (v) => ({ value: _.get(v, [0, this.CHARTS.CUR.prop], 0) })),
            },
          ]);

          this.buildChart();
        } catch (oError) {
          this.debug('Controller > leave App > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onPressSignatureClear() {
        this.byId('signature-pad').clear();
      },

      onPressSave() {},

      onPressApproval() {},

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
