sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    MessageBox,
    AppUtils,
    UI5Error,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.flextime.List', {
      initializeModel() {
        return {
          auth: '',
          busy: {
            Button: false,
            Summary: false,
            Input: false,
          },
          entry: {
            Werks: [],
            Orgeh: [],
          },
          searchConditions: {
            Zyymm: null,
            Werks: null,
            Orgeh: null,
          },
          summary: {
            rowCount: 1,
            list: [],
          },
        };
      },

      async onObjectMatched() {
        try {
          this.setContentsBusy(true);

          await this.initializeSearchConditions();
          await this.readFlextimeList();
        } catch (oError) {
          this.debug('Controller > flextime List > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false);
        }
      },

      async initializeSearchConditions() {
        const oViewModel = this.getViewModel();

        try {
          const oCommonModel = this.getModel(ServiceNames.COMMON);
          const mSearchConditions = oViewModel.getProperty('/searchConditions');
          const mAppointee = this.getAppointeeData();
          const [aPersaEntry, aOrgehEntry] = await Promise.all([
            Client.getEntitySet(oCommonModel, 'WerksList', { Pernr: mAppointee.Pernr }), //
            Client.getEntitySet(oCommonModel, 'DashboardOrgList', { Werks: mAppointee.Werks, Pernr: mAppointee.Pernr }),
          ]);

          oViewModel.setProperty('/searchConditions', {
            Zyymm: _.isEmpty(mSearchConditions.Zyymm) ? moment().format('YYYYMM') : mSearchConditions.Zyymm,
            Werks: _.isEmpty(mSearchConditions.Werks) ? mAppointee.Werks : mSearchConditions.Werks,
            Orgeh: _.isEmpty(mSearchConditions.Orgeh) ? (_.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh'])) : mSearchConditions.Orgeh,
          });
          oViewModel.setProperty(
            '/entry/Werks',
            _.map(aPersaEntry, (o) => _.chain(o).omit('__metadata').omitBy(_.isNil).omitBy(_.isEmpty).value())
          );
          oViewModel.setProperty(
            '/entry/Orgeh',
            _.map(aOrgehEntry, (o) => _.chain(o).omit('__metadata').omitBy(_.isNil).omitBy(_.isEmpty).value())
          );
        } catch (oError) {
          throw oError;
        }
      },

      async onPressSearch() {
        try {
          this.setContentsBusy(true, ['Button', 'Summary']);

          await this.readFlextimeList();
        } catch (oError) {
          this.debug('Controller > Flextime List > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Button', 'Summary']);
        }
      },

      async readFlextimeList() {
        try {
          const oViewModel = this.getViewModel();
          const oTable = this.byId('flextimeSummaryListTable');
          const mSearchConditions = oViewModel.getProperty('/searchConditions');

          const aRowData = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'FlexTimeList', {
            Menid: this.getCurrentMenuId(),
            ...mSearchConditions,
          });

          oViewModel.setProperty('/summary/rowCount', _.get(this.TableUtils.count({ oTable, aRowData }), 'rowCount', 1));
          oViewModel.setProperty(
            '/summary/list',
            _.map(aRowData, (o, i) => ({
              ..._.omit(o, '__metadata'),
              Idx: ++i,
              Gaptim: _.toNumber(o.Gaptim),
              Gaptimtx: _.toNumber(o.Gaptim) > 0 ? `+${_.toNumber(o.Gaptim)}` : _.toNumber(o.Gaptim).toString(),
            }))
          );
        } catch (oError) {
          throw oError;
        }
      },

      async onChangeWerks() {
        const oViewModel = this.getViewModel();

        try {
          this.setContentsBusy(true, ['Input', 'Button']);

          const mAppointeeData = this.getAppointeeData();
          const aOrgehEntry = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'DashboardOrgList', {
            Werks: oViewModel.getProperty('/searchConditions/Werks'),
            Pernr: mAppointeeData.Pernr,
          });

          oViewModel.setProperty('/entry/Orgeh', aOrgehEntry);
          oViewModel.setProperty('/searchConditions/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointeeData.Orgeh) ? mAppointeeData.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));
        } catch (oError) {
          this.debug('Controller > Flextime List > onChangeWerks Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Input', 'Button']);
        }
      },

      setContentsBusy(bContentsBusy = true, vTarget = []) {
        const oViewModel = this.getViewModel();
        const mBusy = oViewModel.getProperty('/busy');

        if (_.isEmpty(vTarget)) {
          _.forOwn(mBusy, (v, p) => _.set(mBusy, p, bContentsBusy));
        } else {
          if (_.isArray(vTarget)) {
            _.forEach(vTarget, (s) => _.set(mBusy, s, bContentsBusy));
          } else {
            _.set(mBusy, vTarget, bContentsBusy);
          }
        }

        oViewModel.refresh();
      },

      onPressExcelDownload() {
        const oTable = this.byId('flextimeSummaryListTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_40007'); // {선택적근로제 현황}_목록

        this.TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
