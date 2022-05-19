sap.ui.define(
  [
    //
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    //
    Fragment,
    Filter,
    FilterOperator,
    MessageBox,
    AppUtils,
    ComboEntry,
    UI5Error,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.talent.mobile.Talent', {
      initializeModel() {
        return {
          busy: false,
          isLoaded: false,
          entry: {
            Werks: [],
            A: [],
            B: [],
            C: [],
            D: [],
            E: [],
            F: [],
            G: [],
            H: [],
            I: [],
            J: [],
            K: [],
            L: [],
            M: [],
          },
          saved: {
            busy: false,
            Schtl: '',
            selectedCondition: ['ALL'],
            entry: [],
          },
          search: {
            Command: 'AND',
            Werks: [],
            Freetx: '',
            Prcty: 'A',
            Jobgr: [],
            Zzjikgb: [],
            Zzjikch: [],
            EeageFr: [],
            EeageTo: [],
            Schcd: [],
            Major: [],
            Slabs: [],
            Cttyp: [],
            Quali1: [],
            Langlv1: [],
            Quali2: [],
            Langlv2: [],
            Quali3: [],
            Langlv3: [],
            Gesch: [],
            Stell1: [],
            SyearFr1: [],
            SyearTo1: [],
            Stell2: [],
            SyearFr2: [],
            SyearTo2: [],
            Stell3: [],
            SyearFr3: [],
            SyearTo3: [],
            Stell4: [],
            SyearFr4: [],
            SyearTo4: [],
          },
          result: {
            busy: false,
            totalCount: 0,
            list: [],
          },
          fieldLimit: {},
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();
        const bIsLoaded = oViewModel.getProperty('/isLoaded');

        if (bIsLoaded) return;

        try {
          oViewModel.setSizeLimit(2000);
          oViewModel.setData(this.initializeModel());
          oViewModel.setProperty('/busy', true);

          await this.getEntrySearchCondition();
          oViewModel.setProperty('/saved/selectedCondition', ['ALL']);

          const oPAModel = this.getModel(ServiceNames.PA);
          const sPernr = this.getAppointeeProperty('Pernr');
          const sWerks = this.getAppointeeProperty('Werks');
          const aEntryDataList = await Promise.all([
            Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'PersAreaList', { Pernr: sPernr }), //
            ..._.chain('ABCDEFGHIJKLM')
              .split('')
              .map((s) => Client.getEntitySet(oPAModel, 'TalentSearchCodeList', { Werks: sWerks, Pernr: sPernr, Schfld: s }))
              .value(),
          ]);

          const aIncludeResetEntry = ['D', 'I', 'J', 'K', 'L', 'M'];
          const aNumberCodeEntry = ['D', 'M'];

          oViewModel.setProperty('/fieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.PA, 'TalentSearch'), this.getEntityLimit(ServiceNames.PA, 'TalentSearchCondition')));
          oViewModel.setProperty('/search/Werks', _.concat(this.getAppointeeProperty('Werks')));
          oViewModel.setProperty('/entry', {
            Werks: _.map(aEntryDataList[0], (o) => _.omit(o, '__metadata')),
            ..._.chain('ABCDEFGHIJKLM')
              .split('')
              .map((s, i) => ({ [s]: this.convertSearchConditionEntry({ aEntries: aEntryDataList[++i], bContainReset: _.includes(aIncludeResetEntry, s), bNumberCode: _.includes(aNumberCodeEntry, s) }) }))
              .reduce((acc, cur) => ({ ...acc, ...cur }), {})
              .value(),
          });
        } catch (oError) {
          this.debug('Controller > Talent Mobile > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);

          this.getView().addEventDelegate({
            onBeforeHide: (evt) => {
              if (!_.endsWith(evt.toId, 'employee') && !_.endsWith(evt.toId, 'talentCompare')) oViewModel.setProperty('/isLoaded', false);
            },
          });
        }
      },

      convertSearchConditionEntry({ aEntries, bContainReset = false, bNumberCode = false }) {
        return _.chain(aEntries)
          .map((o) => ({ ..._.omit(o, '__metadata'), Zcode: bNumberCode ? _.toNumber(o.Zcode) : _.trim(o.Zcode) }))
          .thru((arr) => (bContainReset ? [{ Zcode: '', Ztext: '' }, ...arr] : arr))
          .value();
      },

      async onPressDetailConditionsDialog() {
        if (!this.oDetailConditionsDialog) {
          this.oDetailConditionsDialog = await Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.talent.mobile.fragment.DetailConditionsDialog',
            controller: this,
          });

          this.oDetailConditionsDialog.attachAfterOpen(() => {
            this.scrollStartToken();
          });

          this.getView().addDependent(this.oDetailConditionsDialog);
        }

        this.oDetailConditionsDialog.open();
      },

      onPressDetailClose() {
        this.oDetailConditionsDialog.close();
      },

      async onPressDetailSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/search/Prcty', 'B');
          this.resetSimpleSearch();

          this.validSearchConditions();

          oViewModel.setProperty('/result/busy', true);

          await this.readTalentSearch();
        } catch (oError) {
          this.debug('Controller > Talent Mobile > onPressDetailSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          setTimeout(() => oViewModel.setProperty('/result/busy', false), 200);
          setTimeout(() => this.byId('talentList').removeSelections(), 300);
          this.oDetailConditionsDialog.close();
        }
      },

      async onPressLegend(oEvent) {
        const oView = this.getView();
        const oControl = oEvent.getSource();

        if (!this._oLegendPopover) {
          this._oLegendPopover = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.talent.mobile.fragment.LegendPopover',
            controller: this,
          });

          oView.addDependent(this._oLegendPopover);
        }

        this._oLegendPopover.openBy(oControl);
      },

      onPressCompare() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        try {
          const oTalentList = this.byId('talentList');
          const aSelectedContexts = oTalentList.getSelectedContexts();

          if (aSelectedContexts.length < 2) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35011') }); // 프로파일 비교할 데이터를 선택하여 주십시오.

          const aPernr = _.chain(aSelectedContexts)
            .map((o) => _.get(o.getObject(), 'Pernr'))
            .join('|')
            .value();

          oViewModel.setProperty('/isLoaded', true);
          this.getRouter().navTo('mobile/m/talent-compare', { pernrs: aPernr });
        } catch (oError) {
          this.debug('Controller > Talent Mobile > onPressCompare Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      scrollStartToken() {
        setTimeout(() => {
          $('.sapMTokenizer').each(function () {
            $(this).scrollLeft(0);
          });
        }, 200);
      },

      onPressCompareDialogClose() {
        this.oTalentCompareDialog.close();
      },

      onPairValue(oEvent) {
        this.onMultiToSingleCombo(oEvent);

        const oViewModel = this.getViewModel();
        const oControl = oEvent.getSource();
        const sValue = _.get(oControl.getSelectedKeys(), 0);
        const sTargetProp = oControl.data('target');
        const sTargetValue = oViewModel.getProperty(`/search/${sTargetProp}/0`);

        if (_.isEmpty(sTargetValue) || sValue > sTargetValue) {
          oViewModel.setProperty(`/search/${sTargetProp}`, _.concat(sValue));
        }

        if (_.isEmpty(sValue)) {
          oViewModel.setProperty(`/search/${sTargetProp}`, []);
        }

        oControl.getParent().getItems()[2].getBinding('items').filter(new Filter('Zcode', FilterOperator.GE, sValue));
      },

      async onChangeSearchCondition(oEvent) {
        const oViewModel = this.getViewModel();

        try {
          this.onMultiToSingleCombo(oEvent);

          const sSelectedCondition = oViewModel.getProperty('/saved/selectedCondition/0');

          if (sSelectedCondition === 'ALL') return;

          oViewModel.setProperty('/busy', true);

          await this.readSearchCondition(sSelectedCondition);
          this.showComplexSearch();
        } catch (oError) {
          this.debug('Controller > Talent Mobile > onChangeSearchCondition Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onChangeQuali(oEvent) {
        this.onMultiToSingleCombo(oEvent);

        const oViewModel = this.getViewModel();
        const sSeq = oEvent.getSource().data('seq');

        oViewModel.setProperty(`/search/Langlv${sSeq}`, []);
      },

      onChangeStell(oEvent) {
        this.onMultiToSingleCombo(oEvent);

        const oViewModel = this.getViewModel();
        const sSeq = oEvent.getSource().data('seq');

        oViewModel.setProperty(`/search/SyearFr${sSeq}`, []);
        oViewModel.setProperty(`/search/SyearTo${sSeq}`, []);
      },

      onPressDeleteSearchCondition() {
        if (this.getViewModel().getProperty('/saved/selectedCondition/0') === 'ALL') return;

        MessageBox.confirm(this.getBundleText('MSG_35010'), {
          // 검색조건을 삭제하시겠습니까?
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            this.deleteConditionsProcess();
          },
        });
      },

      async deleteConditionsProcess() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        try {
          const sSelectedCondition = oViewModel.getProperty('/saved/selectedCondition/0');

          await Client.remove(this.getModel(ServiceNames.PA), 'TalentSearchCondition', {
            Pernr: this.getAppointeeProperty('Pernr'),
            Schtl: sSelectedCondition,
          });

          await this.getEntrySearchCondition();

          this.resetComplexSearch();

          MessageBox.success(this.getBundleText('MSG_00007', 'LABEL_00110')); // {삭제}되었습니다.
        } catch (oError) {
          this.debug('Controller > Talent Mobile > onPressDeleteSearchCondition Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onPressSaveConditions() {
        MessageBox.confirm(this.getBundleText('MSG_35008'), {
          // 검색조건을 저장하시겠습니까?
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            this.saveConditionsProcess();
          },
        });
      },

      async saveConditionsProcess() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        try {
          const sConditionSubject = oViewModel.getProperty('/saved/Schtl');

          this.validSearchConditions();
          if (_.isEmpty(sConditionSubject)) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35009') }); // 검색조건명을 입력하여 주십시오.

          await this.createSearchCondition();

          await this.getEntrySearchCondition();

          oViewModel.setProperty('/saved/selectedCondition', _.concat(sConditionSubject));

          MessageBox.success(this.getBundleText('MSG_00007', 'LABEL_00103')); // {저장}되었습니다.
        } catch (oError) {
          this.debug('Controller > Talent Mobile > saveConditionsProcess Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async readSearchCondition(sSelectedCondition) {
        const oViewModel = this.getViewModel();

        try {
          const [mSearchCondition] = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'TalentSearchCondition', {
            Pernr: this.getAppointeeProperty('Pernr'),
            Schtl: sSelectedCondition,
          });

          const mSearch = oViewModel.getProperty('/search');

          oViewModel.setProperty('/saved/Schtl', mSearchCondition.Schtl);
          oViewModel.setProperty('/search', {
            ...mSearch,
            ..._.chain(mSearchCondition) //
              .omit(['__metadata', 'Pernr', 'Schtl'])
              .set('Jobgr', _.isEmpty(mSearchCondition.Jobgr) ? [] : _.split(mSearchCondition.Jobgr, '|'))
              .set('Zzjikgb', _.isEmpty(mSearchCondition.Zzjikgb) ? [] : _.split(mSearchCondition.Zzjikgb, '|'))
              .set('Zzjikch', _.isEmpty(mSearchCondition.Zzjikch) ? [] : _.split(mSearchCondition.Zzjikch, '|'))
              .set('Schcd', _.isEmpty(mSearchCondition.Schcd) ? [] : _.split(mSearchCondition.Schcd, '|'))
              .set('Major', _.isEmpty(mSearchCondition.Major) ? [] : _.split(mSearchCondition.Major, '|'))
              .set('Slabs', _.isEmpty(mSearchCondition.Slabs) ? [] : _.split(mSearchCondition.Slabs, '|'))
              .set('Cttyp', _.isEmpty(mSearchCondition.Cttyp) ? [] : _.split(mSearchCondition.Cttyp, '|'))
              .set('Stell1', mSearchCondition.Stell1 === '00000000' ? [] : _.concat(mSearchCondition.Stell1))
              .set('Stell2', mSearchCondition.Stell2 === '00000000' ? [] : _.concat(mSearchCondition.Stell2))
              .set('Stell3', mSearchCondition.Stell3 === '00000000' ? [] : _.concat(mSearchCondition.Stell3))
              .set('Stell4', mSearchCondition.Stell4 === '00000000' ? [] : _.concat(mSearchCondition.Stell4))
              .set('EeageFr', _.isEmpty(mSearchCondition.EeageFr) ? [] : _.concat(mSearchCondition.EeageFr))
              .set('EeageTo', _.isEmpty(mSearchCondition.EeageTo) ? [] : _.concat(mSearchCondition.EeageTo))
              .set('Quali1', _.isEmpty(mSearchCondition.Quali1) ? [] : _.concat(mSearchCondition.Quali1))
              .set('Langlv1', _.isEmpty(mSearchCondition.Langlv1) ? [] : _.concat(mSearchCondition.Langlv1))
              .set('Quali2', _.isEmpty(mSearchCondition.Quali2) ? [] : _.concat(mSearchCondition.Quali2))
              .set('Langlv2', _.isEmpty(mSearchCondition.Langlv2) ? [] : _.concat(mSearchCondition.Langlv2))
              .set('Quali3', _.isEmpty(mSearchCondition.Quali3) ? [] : _.concat(mSearchCondition.Quali3))
              .set('Langlv3', _.isEmpty(mSearchCondition.Langlv3) ? [] : _.concat(mSearchCondition.Langlv3))
              .set('Gesch', _.isEmpty(mSearchCondition.Gesch) ? [] : _.concat(mSearchCondition.Gesch))
              .set('SyearFr1', _.isEmpty(mSearchCondition.SyearFr1) ? [] : _.concat(mSearchCondition.SyearFr1))
              .set('SyearTo1', _.isEmpty(mSearchCondition.SyearTo1) ? [] : _.concat(mSearchCondition.SyearTo1))
              .set('SyearFr2', _.isEmpty(mSearchCondition.SyearFr2) ? [] : _.concat(mSearchCondition.SyearFr2))
              .set('SyearTo2', _.isEmpty(mSearchCondition.SyearTo2) ? [] : _.concat(mSearchCondition.SyearTo2))
              .set('SyearFr3', _.isEmpty(mSearchCondition.SyearFr3) ? [] : _.concat(mSearchCondition.SyearFr3))
              .set('SyearTo3', _.isEmpty(mSearchCondition.SyearTo3) ? [] : _.concat(mSearchCondition.SyearTo3))
              .set('SyearFr4', _.isEmpty(mSearchCondition.SyearFr4) ? [] : _.concat(mSearchCondition.SyearFr4))
              .set('SyearTo4', _.isEmpty(mSearchCondition.SyearTo4) ? [] : _.concat(mSearchCondition.SyearTo4))
              .value(),
          });
        } catch (oError) {
          throw oError;
        }
      },

      async createSearchCondition() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/saved/busy', true);

        try {
          const mSearch = this.getSearchConditions();
          const mSchtl = oViewModel.getProperty('/saved/Schtl');

          await Client.create(this.getModel(ServiceNames.PA), 'TalentSearchCondition', {
            Pernr: this.getAppointeeProperty('Pernr'),
            Schtl: mSchtl,
            ..._.chain(mSearch)
              .omit(['Freetx', 'Prcty'])
              .tap((obj) => {
                _.chain(obj)
                  .forEach((v, p) => {
                    if (_.isArray(v)) _.set(obj, p, _.join(v, '|'));
                  })
                  .commit();
              })
              .value(),
          });
        } catch (oError) {
          throw oError;
        } finally {
          setTimeout(() => oViewModel.setProperty('/saved/busy', false), 200);
        }
      },

      async getEntrySearchCondition() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/saved/busy', true);

        try {
          const aSearchResults = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'TalentSearchCodeList', { Pernr: this.getAppointeeProperty('Pernr'), Schfld: 'N' });

          oViewModel.setProperty('/saved/entry', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: _.map(aSearchResults, (o) => _.omit(o, '__metadata')) }));
        } catch (oError) {
          throw oError;
        } finally {
          setTimeout(() => oViewModel.setProperty('/saved/busy', false), 200);
        }
      },

      async readTalentSearch() {
        const oViewModel = this.getViewModel();

        try {
          const mSearch = this.getSearchConditions();

          _.chain(mSearch)
            .set('Freetx', _.chain(mSearch.Freetx).replace(/ /g, '').replace(/[,]/g, '/').value()) //
            .set('Cttyp', _.compact(mSearch.Cttyp))
            .set('Jobgr', _.compact(mSearch.Jobgr))
            .set('Major', _.compact(mSearch.Major))
            .set('Schcd', _.compact(mSearch.Schcd))
            .set('Slabs', _.compact(mSearch.Slabs))
            .set('Zzjikch', _.compact(mSearch.Zzjikch))
            .set('Zzjikgb', _.compact(mSearch.Zzjikgb))
            .commit();

          const mFilters = mSearch.Prcty === 'A' ? _.pick(mSearch, ['Freetx', 'Command', 'Prcty', 'Werks']) : _.omit(mSearch, 'Freetx', 'Command');
          const aSearchResults = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'TalentSearch', { Pernr: this.getAppointeeProperty('Pernr'), ..._.omitBy(mFilters, _.isEmpty) });
          const mState = { 1: 'Indication01', 2: 'Indication02', 3: 'Indication03' };
          const sUnknownAvatarImageURL = this.getUnknownAvatarImageURL();

          oViewModel.setProperty('/result/totalCount', aSearchResults.length);
          oViewModel.setProperty(
            '/result/list',
            _.map(aSearchResults, (o) => ({ ..._.omit(o, '__metadata'), ColtyState: mState[o.Colty], PicUrl: _.isEmpty(o.PicUrl) ? sUnknownAvatarImageURL : o.PicUrl }))
          );
        } catch (oError) {
          throw oError;
        }
      },

      validSearchConditions() {
        const mSearch = this.getSearchConditions();

        if (mSearch.Prcty === 'A') {
          if (_.isEmpty(mSearch.Freetx)) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35006') }); // 검색어를 입력하여 주십시오.
        } else {
          if (_.chain(mSearch).omit(['Prcty', 'Werks', 'Command']).omitBy(_.isEmpty).isEmpty().value()) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35007') }); // 검색조건을 입력하여 주십시오.
          if (_.toNumber(mSearch.EeageFr) > _.toNumber(mSearch.EeageTo)) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35002') }); // 나이 입력값의 최소값이 최대값보다 큽니다.
          if (!_.isEmpty(mSearch.Quali1) && _.isEmpty(mSearch.Langlv1)) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35003', 'LABEL_35009', '1') }); // {외국어}{1} 값을 입력하여 주십시오.
          if (!_.isEmpty(mSearch.Quali2) && _.isEmpty(mSearch.Langlv2)) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35003', 'LABEL_35009', '2') }); // {외국어}{2} 값을 입력하여 주십시오.
          if (!_.isEmpty(mSearch.Quali3) && _.isEmpty(mSearch.Langlv3)) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35003', 'LABEL_35009', '3') }); // {외국어}{3} 값을 입력하여 주십시오.
          if (!_.isEmpty(mSearch.Stell1) && (_.isEmpty(mSearch.SyearFr1) || _.isEmpty(mSearch.SyearTo1))) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35004', '1') }); // 직무기간{1}의 시작/종료값을 모두 입력하여 주십시오.
          if (_.toNumber(mSearch.SyearFr1) > _.toNumber(mSearch.SyearTo1)) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35005', '1') }); // 직무기간{1} 입력값의 최소값이 최대값보다 큽니다.
          if (!_.isEmpty(mSearch.Stell2) && (_.isEmpty(mSearch.SyearFr2) || _.isEmpty(mSearch.SyearTo2))) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35004', '2') }); // 직무기간{2}의 시작/종료값을 모두 입력하여 주십시오.
          if (_.toNumber(mSearch.SyearFr2) > _.toNumber(mSearch.SyearTo2)) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35005', '2') }); // 직무기간{2} 입력값의 최소값이 최대값보다 큽니다.
          if (!_.isEmpty(mSearch.Stell3) && (_.isEmpty(mSearch.SyearFr3) || _.isEmpty(mSearch.SyearTo3))) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35004', '3') }); // 직무기간{3}의 시작/종료값을 모두 입력하여 주십시오.
          if (_.toNumber(mSearch.SyearFr3) > _.toNumber(mSearch.SyearTo3)) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35005', '3') }); // 직무기간{3} 입력값의 최소값이 최대값보다 큽니다.
          if (!_.isEmpty(mSearch.Stell4) && (_.isEmpty(mSearch.SyearFr4) || _.isEmpty(mSearch.SyearTo4))) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35004', '4') }); // 직무기간{4}의 시작/종료값을 모두 입력하여 주십시오.
          if (_.toNumber(mSearch.SyearFr4) > _.toNumber(mSearch.SyearTo4)) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35005', '4') }); // 직무기간{4} 입력값의 최소값이 최대값보다 큽니다.
        }
      },

      async onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/search/Prcty', 'A');
          this.resetComplexSearch();

          this.validSearchConditions();

          oViewModel.setProperty('/result/busy', true);

          await this.readTalentSearch();
        } catch (oError) {
          this.debug('Controller > Talent Mobile > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          setTimeout(() => oViewModel.setProperty('/result/busy', false), 200);
          setTimeout(() => this.byId('talentList').removeSelections(), 300);
        }
      },

      showComplexSearch() {
        this.getViewModel().setProperty('/search/Prcty', 'B');
        this.resetSimpleSearch();
        this.clearSearchResults();

        this.onPressDetailConditionsDialog();
      },

      onPressConditionReset() {
        const oViewModel = this.getViewModel();
        const sPrcty = oViewModel.getProperty('/search/Prcty');

        this.clearSearchResults();

        if (sPrcty === 'A') {
          this.resetSimpleSearch();
        } else {
          this.resetComplexSearch();
        }
      },

      clearSearchResults() {
        this.byId('talentList').removeSelections();
        this.getViewModel().setProperty('/result', {
          busy: false,
          totalCount: 0,
          list: [],
        });
      },

      getSearchConditions() {
        const mSearchConditions = this.getViewModel().getProperty('/search');

        return _.chain(mSearchConditions)
          .cloneDeep()
          .set('Werks', _.get(mSearchConditions, ['Werks', 0]))
          .set('EeageFr', _.get(mSearchConditions, ['EeageFr', 0]))
          .set('EeageTo', _.get(mSearchConditions, ['EeageTo', 0]))
          .set('Quali1', _.get(mSearchConditions, ['Quali1', 0]))
          .set('Langlv1', _.get(mSearchConditions, ['Langlv1', 0]))
          .set('Quali2', _.get(mSearchConditions, ['Quali2', 0]))
          .set('Langlv2', _.get(mSearchConditions, ['Langlv2', 0]))
          .set('Quali3', _.get(mSearchConditions, ['Quali3', 0]))
          .set('Langlv3', _.get(mSearchConditions, ['Langlv3', 0]))
          .set('Gesch', _.get(mSearchConditions, ['Gesch', 0]))
          .set('Stell1', _.get(mSearchConditions, ['Stell1', 0]))
          .set('SyearFr1', _.get(mSearchConditions, ['SyearFr1', 0]))
          .set('SyearTo1', _.get(mSearchConditions, ['SyearTo1', 0]))
          .set('Stell2', _.get(mSearchConditions, ['Stell2', 0]))
          .set('SyearFr2', _.get(mSearchConditions, ['SyearFr2', 0]))
          .set('SyearTo2', _.get(mSearchConditions, ['SyearTo2', 0]))
          .set('Stell3', _.get(mSearchConditions, ['Stell3', 0]))
          .set('SyearFr3', _.get(mSearchConditions, ['SyearFr3', 0]))
          .set('SyearTo3', _.get(mSearchConditions, ['SyearTo3', 0]))
          .set('Stell4', _.get(mSearchConditions, ['Stell4', 0]))
          .set('SyearFr4', _.get(mSearchConditions, ['SyearFr4', 0]))
          .set('SyearTo4', _.get(mSearchConditions, ['SyearTo4', 0]))
          .value();
      },

      onPressPic(oEvent) {
        const mRowData = oEvent.getSource().getParent().getParent().getParent().getBindingContext().getObject();

        this.navEmployee(mRowData.Pernr);
      },

      onPressDialogPic(oEvent) {
        const mRowData = oEvent.getSource().getParent().getParent().getBindingContext().getObject();

        this.navEmployee(mRowData.Pernr);
      },

      navEmployee(sPernr) {
        if (!sPernr) return;

        this.getViewModel().setProperty('/isLoaded', true);
        this.getRouter().navTo('mobile/employee', { pernr: sPernr });
      },

      resetSimpleSearch() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/search/Freetx', '');
        oViewModel.setProperty('/search/Command', 'AND');
      },

      resetComplexSearch() {
        const oViewModel = this.getViewModel();
        const mSearch = oViewModel.getProperty('/search');

        oViewModel.setProperty('/saved/selectedCondition', ['ALL']);
        oViewModel.setProperty('/saved/Schtl', '');
        oViewModel.setProperty(
          '/search',
          _.chain(mSearch)
            .set('Jobgr', [])
            .set('Zzjikgb', [])
            .set('Zzjikch', [])
            .set('EeageFr', [])
            .set('EeageTo', [])
            .set('Schcd', [])
            .set('Major', [])
            .set('Slabs', [])
            .set('Cttyp', [])
            .set('Quali1', [])
            .set('Langlv1', [])
            .set('Quali2', [])
            .set('Langlv2', [])
            .set('Quali3', [])
            .set('Langlv3', [])
            .set('Gesch', [])
            .set('Stell1', [])
            .set('SyearFr1', [])
            .set('SyearTo1', [])
            .set('Stell2', [])
            .set('SyearFr2', [])
            .set('SyearTo2', [])
            .set('Stell3', [])
            .set('SyearFr3', [])
            .set('SyearTo3', [])
            .set('Stell4', [])
            .set('SyearFr4', [])
            .set('SyearTo4', [])
            .value()
        );
      },
    });
  }
);
