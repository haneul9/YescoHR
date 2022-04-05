sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/DateUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    MessageBox,
    Appno,
    AppUtils,
    AttachFileAction,
    DateUtils,
    Client,
    ServiceNames,
    UI5Error,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.leavePlan.App', {
      APPTP: 'HR13',
      AWART_COUNT: { 2000: 1, 2010: 1, 2001: 0.5, 2002: 0.5 },

      initializeModel() {
        return {
          busy: false,
          search: {
            Plnyy: moment().format('YYYY'),
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
            selectedDay: '',
            count: {},
            raw: [],
            grid: [],
          },
        };
      },

      async onObjectMatched(mParameter) {
        const oViewModel = this.getViewModel();

        oViewModel.setSizeLimit(500);
        oViewModel.setData(this.initializeModel());

        try {
          oViewModel.setProperty('/busy', true);

          if (!_.isEmpty(mParameter.Plnyy) && !_.isEmpty(mParameter.Seqno)) {
            oViewModel.setProperty('/search/Plnyy', mParameter.Plnyy);
            await this.setHolPlanSeqno();
            oViewModel.setProperty('/search/Seqno', mParameter.Seqno);
          } else {
            await this.setHolPlanSeqno();
          }

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
        oViewModel.setProperty('/plans/raw', []);
      },

      getBoxObject({ day = 'NONE', label = '', classNames = '', awart = '' }) {
        return { day, label, classNames, awart };
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
        const mCount = oViewModel.getProperty('/plans/count');
        const mPlansRawData = oViewModel.getProperty('/plans/raw');
        const sYear = oViewModel.getProperty('/search/Plnyy');
        const sYearMonth = `${sYear}-${_.padStart(iMonth + 1, 2, '0')}`;

        _.set(mCount, iMonth + 1, 0);

        return [
          this.getBoxObject({ label: this.getBundleText('LABEL_20011', iMonth + 1), classNames: 'Header' }), //  {0}월
          this.getBoxObject({ day: `Count-${iMonth + 1}`, label: 0, classNames: 'Header' }),
          ..._.times(31, (n) => {
            const sDay = `${sYearMonth}-${_.padStart(n + 1, 2, '0')}`;
            return this.getBoxObject({ day: sDay, label: '', classNames: this.getDayStyle(mPlansRawData, sDay), awart: _.get(mPlansRawData, [sDay, 'Awart'], '') });
          }),
        ];
      },

      getDayStyle(mPlansRawData, sDay) {
        const sHolyn = _.get(mPlansRawData, [sDay, 'Holyn']);
        const sInpyn = _.get(mPlansRawData, [sDay, 'Inpyn']);
        const mClasses = {
          Weekend: { sHolyn: 'X', sInpyn: '' },
          Disable: { sHolyn: '', sInpyn: '' },
          Normal: { sHolyn: '', sInpyn: 'X' },
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
          const iZappStatAl = _.toNumber(mSummary.ZappStatAl);

          _.chain(mButtons)
            .set('SAVE', !_.inRange(iZappStatAl, 11, 65))
            .set('APPROVAL', !_.inRange(iZappStatAl, 11, 65))
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

      calcMonthLeaveCount() {
        const oViewModel = this.getViewModel();
        const aGridPlans = oViewModel.getProperty('/plans/grid');
        const aGridCounts = aGridPlans.filter((o) => _.startsWith(o.day, 'Count'));
        const mGroupByMonth = _.chain(aGridPlans)
          .reject({ awart: '' })
          .groupBy((o) => _.chain(o.day).split('-', '2').last().toNumber().value())
          .map((v, p) => ({ [p]: _.sumBy(v, (obj) => this.AWART_COUNT[obj.awart]) }))
          .reduce((a, c) => ({ ...a, ...c }), {})
          .value();

        const mCount = oViewModel.getProperty('/plans/count');

        _.chain(mCount)
          .forOwn((v, p, obj) => _.set(obj, p, 0))
          .assign(mGroupByMonth)
          .forOwn((v, p) => _.set(aGridCounts, [p - 1, 'label'], v))
          .commit();

        const mGroupByAwart = _.chain(aGridPlans)
          .filter((o) => !_.isEmpty(o.awart))
          .groupBy('awart')
          .map((v, p) => ({ [p]: _.sumBy(v, (obj) => this.AWART_COUNT[obj.awart]) }))
          .reduce((a, c) => ({ ...a, ...c }), {})
          .value();
        const mSummary = oViewModel.getProperty('/summary');
        const iYearCount = _.sum([mGroupByAwart['2000'], mGroupByAwart['2001'], mGroupByAwart['2002']]) || 0;
        const iSummerCount = mGroupByAwart['2010'] || 0;

        _.chain(mSummary)
          .set('Plncnt', iYearCount)
          .set('Plnperc', _.chain(iYearCount).divide(mSummary.Crecnt).multiply(100).floor().value() || 0)
          .set('Plncnt2', iSummerCount)
          .set('Plnperc2', _.chain(iSummerCount).divide(mSummary.Crecnt2).multiply(100).floor().value() || 0)
          .set('Usecnt3', _.add(iYearCount, iSummerCount))
          .set('Useperc3', _.chain(_.add(iYearCount, iSummerCount)).divide(mSummary.Crecnt3).multiply(100).floor().value() || 0)
          .commit();
      },

      checkLimit(mTargetDay, sAwart) {
        const oViewModel = this.getViewModel();
        const mSummary = oViewModel.getProperty('/summary');

        if (_.isEqual(sAwart, '2010')) {
          if (_.gt(_.add(mSummary.Plncnt2, this.AWART_COUNT[sAwart]), mSummary.Crecnt2)) {
            MessageBox.alert(this.getBundleText('MSG_20003', 'LABEL_20008')); // {하계휴가}의 선택 가능한 개수를 초과하였습니다.
            return false;
          }
        } else {
          const iCurCnt = _.isEmpty(mTargetDay.awart) ? mSummary.Plncnt : _.subtract(mSummary.Plncnt, this.AWART_COUNT[mTargetDay.awart]);

          if (_.gt(_.add(iCurCnt, this.AWART_COUNT[sAwart]), mSummary.Crecnt)) {
            MessageBox.alert(this.getBundleText('MSG_20003', 'LABEL_20006')); // {연차}의 선택 가능한 개수를 초과하였습니다.
            return false;
          }
        }

        return true;
      },

      async uploadSignature() {
        const oViewModel = this.getViewModel();

        try {
          const oSignature = this.byId('signature-pad');
          const mSummary = oViewModel.getProperty('/summary');

          if (!oSignature.isDraw()) throw new UI5Error({ code: 'E', message: this.getBundleText('MSG_20005') }); // 서명을 입력하여 주십시오.

          await AttachFileAction.upload.call(this, mSummary.Appno, this.APPTP, [oSignature.dataURItoBlob()], `Leave-signature-${this.getAppointeeProperty('Pernr')}.png`);
        } catch (oError) {
          throw oError;
        }
      },

      async createProcess(sPrcty) {
        const oViewModel = this.getViewModel();

        try {
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const mSummary = _.cloneDeep(oViewModel.getProperty('/summary'));
          const aPlans = _.cloneDeep(oViewModel.getProperty('/plans/grid'));
          const sPernr = this.getAppointeeProperty('Pernr');
          const sYear = oViewModel.getProperty('/search/year');

          await Client.deep(oModel, 'AnnualLeaveStatus', {
            ...mSummary,
            Prcty: sPrcty,
            Menid: this.getCurrentMenuId(),
            AnnualLeaveNav: _.chain(aPlans)
              .reject({ awart: '' })
              .map((o) => ({ Seqno: '1', Pernr: sPernr, Plnyy: sYear, Tmdat: DateUtils.parse(o.day), Awart: o.awart }))
              .value(),
          });

          // {저장|신청}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', _.isEqual(sPrcty, 'T') ? 'LABEL_00103' : 'LABEL_00121'), {
            onClose: () => {
              this.onPressSearch();
            },
          });
        } catch (oError) {
          this.debug('Controller > leavePlan App > createProcess Error', oError);

          AppUtils.handleError(oError);
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onChangePlnyy() {
        this.setHolPlanSeqno();
      },

      onSelectedAwart(oEvent) {
        const oViewModel = this.getViewModel();
        const mCustomData = oEvent.getSource().data();
        const aAwarts = oViewModel.getProperty('/entry/AwartList');
        const bSelected = oEvent.getParameter('selected');
        const aGridPlans = oViewModel.getProperty('/plans/grid');
        const sDay = oViewModel.getProperty('/plans/selectedDay');
        const mTargetDay = _.find(aGridPlans, { day: sDay });

        if (bSelected && !this.checkLimit(mTargetDay, mCustomData.Awart)) return;

        _.set(mTargetDay, 'awart', bSelected ? mCustomData.Awart : '');

        this.calcMonthLeaveCount();

        this._pPopover.then(function (oPopover) {
          oPopover.close();
          _.forEach(aAwarts, (o) => _.set(o, 'selected', false));
        });
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
          this.calcMonthLeaveCount();
        } catch (oError) {
          this.debug('Controller > leavePlan App > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onClickDay(oEvent) {
        const oView = this.getView();
        const oViewModel = this.getViewModel();
        const { day: sDay, style: sStyle, awart: sAwart } = oEvent.data();

        if (_.isEqual(sDay, 'NONE') || !_.isEqual(sStyle, 'Normal')) return;

        const aAwarts = oViewModel.getProperty('/entry/AwartList');
        _.chain(aAwarts)
          .forEach((o) => _.set(o, 'selected', false))
          .find({ Awart: sAwart })
          .set('selected', true)
          .commit();

        oViewModel.setProperty('/plans/selectedDay', sDay);
        oViewModel.setProperty('/entry/AwartList', aAwarts);

        if (!this._pPopover) {
          this._pPopover = Fragment.load({
            id: oView.getId(),
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

      async onPressSave() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        try {
          const mSummary = oViewModel.getProperty('/summary');

          // validation
          if (!_.isEqual(100, mSummary.Useperc3)) throw new UI5Error({ code: 'E', message: this.getBundleText('MSG_20004') }); // 미계획 일수가 존재합니다. 계획수립이 완료되어야 신청이 가능합니다.

          // Appno 채번
          if (_.isEqual(mSummary.Appno, '00000000000000')) _.set(mSummary, 'Appno', await Appno.get());

          // deep
          MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
            // {저장}하시겠습니까?
            onClose: (sAction) => {
              if (MessageBox.Action.CANCEL === sAction) return;

              this.createProcess('T');
            },
          });
        } catch (oError) {
          this.debug('Controller > leavePlan App > onPressSave Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async onPressApproval() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        try {
          const mSummary = oViewModel.getProperty('/summary');

          // validation
          if (!_.isEqual(100, mSummary.Useperc3)) throw new UI5Error({ code: 'E', message: this.getBundleText('MSG_20004') }); // 미계획 일수가 존재합니다. 계획수립이 완료되어야 신청이 가능합니다.

          // Appno 채번
          if (_.isEqual(mSummary.Appno, '00000000000000')) _.set(mSummary, 'Appno', await Appno.get());

          // 서명
          if (_.isEqual('X', mSummary.Sgnyn)) await this.uploadSignature();

          // deep
          MessageBox.confirm(this.getBundleText(_.isEqual('X', mSummary.Appyn) ? 'MSG_20006' : 'MSG_20007'), {
            // 제출 및 결재 상신하시겠습니까? || 제출 하시겠습니까?
            onClose: (sAction) => {
              if (MessageBox.Action.CANCEL === sAction) return;

              this.createProcess('S');
            },
          });
        } catch (oError) {
          this.debug('Controller > leavePlan App > onPressApproval Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async onPressPrint() {
        const oViewModel = this.getViewModel();
        const mCustomData = oViewModel.getProperty('/summary');
        const mPlanData = await Client.get(this.getModel(ServiceNames.WORKTIME), 'AnnualLeaveStatus', _.pick(mCustomData, ['Appno', 'Plnyy', 'Seqno', 'Pernr']));

        window.open(mPlanData.Pdfurl, '_blank');
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
