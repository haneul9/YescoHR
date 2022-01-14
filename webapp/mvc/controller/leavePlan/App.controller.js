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
            Plnyy: today.format('YYYY'),
            Seqno: '',
          },
          entry: {
            SeqnoList: [],
            AwartList: [],
          },
          buttons: {
            SAVE: false,
            APPROVAL: false,
            PRINT: false,
          },
          summary: {},
          plans: {
            raw: [],
            grid: [],
          },
        });

        oViewModel.setSizeLimit(500);
        this.setViewModel(oViewModel);
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          await this.setHolPlanSeqno();
          this.onPressSearch();
        } catch (oError) {
          this.debug('Controller > leavePlan App > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      buildPlanGrid() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/plans/grid', [
          ...this.getPlanHeader(), //
          ..._.times(12, (n) => this.getPlanBody(n)).reduce((a, b) => [...a, ...b], []),
        ]);
      },

      getBoxObject({ day = 'NONE', label = '', classNames = '' }) {
        return { day, label, classNames };
      },

      getPlanHeader() {
        return [
          this.getBoxObject({ label: this.getBundleText('LABEL_00253'), classNames: 'Header' }), //  월
          this.getBoxObject({ label: this.getBundleText('LABEL_20010'), classNames: 'Header' }), // 개수
          ..._.times(31, (n) => this.getBoxObject({ label: n + 1, classNames: 'Header' })),
        ];
      },

      getPlanBody(iMonth) {
        const oViewModel = this.getViewModel();
        const sYear = oViewModel.getProperty('/search/Plnyy');
        const sYearMonth = `${sYear}-${_.padStart(iMonth + 1, 2, '0')}`;

        return [
          this.getBoxObject({ label: this.getBundleText('LABEL_20011', iMonth + 1), classNames: 'Header' }), //  {0}월
          this.getBoxObject({ label: 0, classNames: 'Header' }),
          ..._.times(31, (n) => {
            const sDay = `${sYearMonth}-${_.padStart(n + 1, 2, '0')}`;
            return this.getBoxObject({ day: sDay, label: '', classNames: this.getDayStyle(sDay) });
          }),
        ];
      },

      getDayStyle(sDay) {
        const mPlansRawData = this.getViewModel().getProperty('/plans/raw');
        const sHolyn = _.get(mPlansRawData, [sDay, 'Holyn']);
        const sInpyn = _.get(mPlansRawData, [sDay, 'Inpyn']);
        const mClasses = {
          Weekend: { sHolyn: 'X', sInpyn: '' },
          Disable: { sHolyn: '', sInpyn: 'X' },
          Normal: { sHolyn: '', sInpyn: '' },
        };

        return moment(sDay).isValid() ? _.chain(mClasses).findKey({ sHolyn, sInpyn }).value() : 'None';
      },

      toggleButton() {
        const oViewModel = this.getViewModel();
        const mSummary = oViewModel.getProperty('/summary');
        const mButtons = oViewModel.getProperty('/buttons');

        if (!_.isEqual(mSummary.Prdyn, 'X')) {
          _.forOwn(mButtons, (value, key, object) => _.set(object, key, false));
        } else {
          const iZappStatAl = _.toNumber(mButtons.ZappStatAl);

          _.chain(mButtons)
            .set('SAVE', _.inRange(iZappStatAl, 11, 65))
            .set('APPROVAL', _.inRange(iZappStatAl, 11, 65))
            .set('PRINT', _.isEqual(iZappStatAl, 20) || _.isEqual(iZappStatAl, 60))
            .commit();
        }
      },

      async setHolPlanSeqno() {
        const oViewModel = this.getViewModel();
        const sPlnyy = oViewModel.getProperty('/search/Plnyy');

        const aSeqno = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'HolPlanSeqno', { Pernr: this.getAppointeeProperty('Pernr'), Plnyy: sPlnyy });

        oViewModel.setProperty('/search/Seqno', _.chain(aSeqno).find({ Curseq: 'X' }).get('Seqno').value());
        oViewModel.setProperty('/entry/SeqnoList', aSeqno);
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onChangePlnyy() {
        this.setHolPlanSeqno();
      },

      onSelectedAwart(oEvent) {
        const oViewModel = this.getViewModel();
        const aAwarts = oViewModel.getProperty('/entry/AwartList');

        _.chain(aAwarts)
          .reject(oEvent.getSource().data())
          .forEach((o) => _.set(o, 'selected', false))
          .commit();
      },

      async onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const mSearchConditions = oViewModel.getProperty('/search');
          const sPernr = this.getAppointeeProperty('Pernr');
          const fCurried = Client.getEntitySet(this.getModel(ServiceNames.WORKTIME));

          const [aAwarts, [mAnnualLeaveStatus], aAnnualLeavePlan] = await Promise.all([
            fCurried('HolPlanAwrsn', { Pernr: sPernr, Plnyy: mSearchConditions.Plnyy }), //
            fCurried('AnnualLeaveStatus', { Pernr: sPernr, ...mSearchConditions }), //
            fCurried('AnnualLeavePlan', { Pernr: sPernr, ...mSearchConditions }),
          ]);

          // 발생/사용 개수 convert to Number
          _.forOwn(mAnnualLeaveStatus, (value, key, object) => {
            if (_.startsWith(key, 'Crecnt') || _.startsWith(key, 'Usecnt')) {
              _.set(object, key, _.toNumber(value));
            }
          });

          oViewModel.setProperty(
            '/entry/AwartList',
            _.map(aAwarts, (o) => _.set(o, 'selected', false))
          );
          oViewModel.setProperty('/summary', _.omit(mAnnualLeaveStatus, '__metadata'));
          oViewModel.setProperty(
            '/plans/raw',
            _.chain(aAnnualLeavePlan)
              .groupBy((o) => moment(o.Tmdat).format('YYYY-MM-DD'))
              .forOwn((v, p, obj) => (obj[p] = _.omit(v[0], '__metadata')))
              .value()
          );

          this.toggleButton();
          this.buildPlanGrid();
        } catch (oError) {
          this.debug('Controller > leavePlan App > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onClickDay(oEvent) {
        const oView = this.getView();
        const { day: sDay, style: sStyle } = oEvent.data();

        if (_.isEqual(sDay, 'NONE') || !_.isEqual(sStyle, 'Normal')) return;

        if (!this._pPopover) {
          this._pPopover = Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.leavePlan.fragment.AwartPopover',
            controller: this,
          }).then(function (oPopover) {
            oView.addDependent(oPopover);
            return oPopover;
          });
        }
        this._pPopover.then(function (oPopover) {
          oPopover.openBy(oEvent);
        });
      },

      onPressSignatureClear() {
        this.byId('signature-pad').clear();
      },

      onPressSave() {},

      onPressApproval() {},

      onPressPrint() {},

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
