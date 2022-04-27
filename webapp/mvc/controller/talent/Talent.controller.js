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

    return BaseController.extend('sap.ui.yesco.mvc.controller.talent.Talent', {
      initializeModel() {
        return {
          busy: false,
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
            selectedCondition: 'ALL',
            entry: [],
          },
          search: {
            Command: 'AND',
            Werks: '',
            Freetx: '',
            Prcty: 'A',
            Jobgr: [],
            Zzjikgb: [],
            Zzjikch: [],
            EeageFr: '',
            EeageTo: '',
            Schcd: [],
            Major: [],
            Slabs: [],
            Cttyp: [],
            Quali1: '',
            Langlv1: '',
            Quali2: '',
            Langlv2: '',
            Quali3: '',
            Langlv3: '',
            Gesch: '',
            Stell1: '',
            SyearFr1: '',
            SyearTo1: '',
            Stell2: '',
            SyearFr2: '',
            SyearTo2: '',
            Stell3: '',
            SyearFr3: '',
            SyearTo3: '',
            Stell4: '',
            SyearFr4: '',
            SyearTo4: '',
          },
          result: {
            busy: false,
            totalCount: 0,
            list: [],
          },
          compare: {
            scroll: true,
            row1: [],
            row2: [],
            row3: [],
            row4: [],
            row5: [],
            row6: [],
            row7: [],
            row8: [],
            row9: [],
            row10: [],
            row11: [],
          },
          fieldLimit: {},
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setSizeLimit(2000);
          oViewModel.setData(this.initializeModel());
          oViewModel.setProperty('/busy', true);

          this.getEntrySearchCondition();
          oViewModel.setProperty('/saved/selectedCondition', 'ALL');

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

          oViewModel.setProperty('/search/Werks', this.getAppointeeProperty('Werks'));
          oViewModel.setProperty('/fieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.PA, 'TalentSearch'), this.getEntityLimit(ServiceNames.PA, 'TalentSearchCondition')));
          oViewModel.setProperty('/entry', {
            Werks: _.map(aEntryDataList[0], (o) => _.omit(o, '__metadata')),
            ..._.chain('ABCDEFGHIJKLM')
              .split('')
              .map((s, i) => ({ [s]: this.convertSearchConditionEntry({ aEntries: aEntryDataList[++i], bContainReset: _.includes(aIncludeResetEntry, s), bNumberCode: _.includes(aNumberCodeEntry, s) }) }))
              .reduce((acc, cur) => ({ ...acc, ...cur }), {})
              .value(),
          });
        } catch (oError) {
          this.debug('Controller > Talent > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.byId('searchFilterBody').removeStyleClass('expanded');
          oViewModel.setProperty('/busy', false);
        }
      },

      convertSearchConditionEntry({ aEntries, bContainReset = false, bNumberCode = false }) {
        return _.chain(aEntries)
          .map((o) => ({ ..._.omit(o, '__metadata'), Zcode: bNumberCode ? _.toNumber(o.Zcode) : _.trim(o.Zcode) }))
          .thru((arr) => (bContainReset ? [{ Zcode: '', Ztext: '' }, ...arr] : arr))
          .value();
      },

      convertCompareRow({ aCompareResults, sLabelCode, sTargetProp, bEvaluation = false }) {
        return _.concat(
          { type: bEvaluation ? 'label' : null, data: [{ type: 'label', value: this.getBundleText(sLabelCode) }] },
          _.map(aCompareResults, (o) => ({
            block9: bEvaluation ? _.toNumber(o.Value07) : null,
            data: _.chain(o)
              .get(sTargetProp)
              .split('<br>')
              .map((d) => ({ type: 'text', value: d }))
              .value(),
          }))
        );
      },

      async onCompareDialog() {
        if (!this.oTalentCompareDialog) {
          this.oTalentCompareDialog = await Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.talent.fragment.CompareDialog',
            controller: this,
          });

          this.getView().addDependent(this.oTalentCompareDialog);

          this.oTalentCompareDialog.attachAfterOpen(() => {
            const sBlockId = this.byId('BlockLayout').getId();
            const $lastBlock = $(`#${sBlockId} > div:last`);

            $lastBlock.off('scroll touchmove mousewheel');
            $lastBlock.on('scroll touchmove mousewheel', function (e) {
              e.preventDefault();
              e.stopPropagation();

              const iScrollLeft = $(this).scrollLeft();

              $(`#${sBlockId} > div:not(:last)`).each(function () {
                $(this).scrollLeft(iScrollLeft);
              });
            });
          });
        }

        this.oTalentCompareDialog.open();
      },

      async onPressCompare() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        try {
          const oTalentList = this.byId('talentList');
          const aSelectedContexts = oTalentList.getSelectedContexts();

          if (aSelectedContexts.length < 2) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35011') }); // 프로파일 비교할 데이터를 선택하여 주십시오.

          const aPernr = _.map(aSelectedContexts, (o) => _.get(o.getObject(), 'Pernr'));
          const aCompareResults = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'TalentSearchComparison', { Pernr: aPernr });

          const sUnknownAvatarImageURL = this.getUnknownAvatarImageURL();
          oViewModel.setProperty('/compare/scroll', aCompareResults.length > 3);
          oViewModel.setProperty(
            '/compare/row1',
            _.concat(
              { type: 'label' },
              _.map(aCompareResults, (o) => ({ type: 'text', Pernr: o.Pernr, Picurl: _.isEmpty(o.Picurl) ? sUnknownAvatarImageURL : o.Picurl, Value01: o.Value01 }))
            )
          );
          oViewModel.setProperty('/compare/row2', this.convertCompareRow({ aCompareResults, sLabelCode: 'LABEL_35013', sTargetProp: 'Value02' })); // 기본정보
          oViewModel.setProperty('/compare/row3', this.convertCompareRow({ aCompareResults, sLabelCode: 'LABEL_00222', sTargetProp: 'Value04' })); // 직무
          oViewModel.setProperty('/compare/row4', this.convertCompareRow({ aCompareResults, sLabelCode: 'LABEL_35016', sTargetProp: 'Value05' })); // 학력
          oViewModel.setProperty('/compare/row5', this.convertCompareRow({ aCompareResults, sLabelCode: 'LABEL_35014', sTargetProp: 'Value06', bEvaluation: true })); // 평가이력
          oViewModel.setProperty('/compare/row6', this.convertCompareRow({ aCompareResults, sLabelCode: 'LABEL_35015', sTargetProp: 'Value03' })); // 사내경력
          oViewModel.setProperty('/compare/row7', this.convertCompareRow({ aCompareResults, sLabelCode: 'LABEL_35017', sTargetProp: 'Value09' })); // 사외경력
          oViewModel.setProperty('/compare/row8', this.convertCompareRow({ aCompareResults, sLabelCode: 'LABEL_35018', sTargetProp: 'Value08' })); // 외국어
          oViewModel.setProperty('/compare/row9', this.convertCompareRow({ aCompareResults, sLabelCode: 'LABEL_35019', sTargetProp: 'Value10' })); // 포상
          oViewModel.setProperty('/compare/row10', this.convertCompareRow({ aCompareResults, sLabelCode: 'LABEL_35020', sTargetProp: 'Value11' })); // 징계
          oViewModel.setProperty('/compare/row11', _.times(aCompareResults.length + 1).map(_.stubObject));

          this.onCompareDialog();
        } catch (oError) {
          this.debug('Controller > Talent > onPressCompare Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onPressCompareDialogClose() {
        this.oTalentCompareDialog.close();
      },

      onPairValue(oEvent) {
        const oViewModel = this.getViewModel();
        const oControl = oEvent.getSource();
        const sValue = oControl.getSelectedKey();
        const sTargetProp = oControl.data('target');
        const sTargetValue = oViewModel.getProperty(`/search/${sTargetProp}`);

        if (_.isEmpty(sTargetValue) || sValue > sTargetValue) {
          oViewModel.setProperty(`/search/${sTargetProp}`, oControl.getSelectedKey());
        }

        if (_.isEmpty(sValue)) {
          oViewModel.setProperty(`/search/${sTargetProp}`, '');
        }

        oControl.getParent().getItems()[2].getBinding('items').filter(new Filter('Zcode', FilterOperator.GE, oControl.getSelectedKey()));
      },

      async onChangeSearchCondition() {
        const oViewModel = this.getViewModel();

        try {
          const sSelectedCondition = oViewModel.getProperty('/saved/selectedCondition');

          if (sSelectedCondition === 'ALL') return;

          oViewModel.setProperty('/busy', true);

          this.showComplexSearch();
          await this.readSearchCondition(sSelectedCondition);
        } catch (oError) {
          this.debug('Controller > Talent > onChangeSearchCondition Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onChangeQuali(oEvent) {
        const oViewModel = this.getViewModel();
        const sSeq = oEvent.getSource().data('seq');

        oViewModel.setProperty(`/search/Langlv${sSeq}`, '');
      },

      onChangeStell(oEvent) {
        const oViewModel = this.getViewModel();
        const sSeq = oEvent.getSource().data('seq');

        oViewModel.setProperty(`/search/SyearFr${sSeq}`, '');
        oViewModel.setProperty(`/search/SyearTo${sSeq}`, '');
      },

      onPressDeleteSearchCondition() {
        if (this.getViewModel().getProperty('/saved/selectedCondition') === 'ALL') return;

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
          const sSelectedCondition = oViewModel.getProperty('/saved/selectedCondition');

          await Client.remove(this.getModel(ServiceNames.PA), 'TalentSearchCondition', {
            Pernr: this.getAppointeeProperty('Pernr'),
            Schtl: sSelectedCondition,
          });

          await this.getEntrySearchCondition();

          this.resetComplexSearch();

          MessageBox.success(this.getBundleText('MSG_00007', 'LABEL_00110')); // {삭제}되었습니다.
        } catch (oError) {
          this.debug('Controller > Talent > onPressDeleteSearchCondition Error', oError);

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

          oViewModel.setProperty('/saved/selectedCondition', sConditionSubject);

          MessageBox.success(this.getBundleText('MSG_00007', 'LABEL_00103')); // {저장}되었습니다.
        } catch (oError) {
          this.debug('Controller > Talent > saveConditionsProcess Error', oError);

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
              .set('Stell1', mSearchCondition.Stell1 === '00000000' ? '' : mSearchCondition.Stell1)
              .set('Stell2', mSearchCondition.Stell2 === '00000000' ? '' : mSearchCondition.Stell2)
              .set('Stell3', mSearchCondition.Stell3 === '00000000' ? '' : mSearchCondition.Stell3)
              .set('Stell4', mSearchCondition.Stell4 === '00000000' ? '' : mSearchCondition.Stell4)
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
          const mSearch = oViewModel.getProperty('/search');
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
          const mSearch = _.cloneDeep(oViewModel.getProperty('/search'));
          _.chain(mSearch).set('Freetx', _.chain(mSearch.Freetx).replace(/ /g, '').replace(/[,]/g, '/').value()).set('Cttyp', _.compact(mSearch.Cttyp)).set('Jobgr', _.compact(mSearch.Jobgr)).set('Major', _.compact(mSearch.Major)).set('Schcd', _.compact(mSearch.Schcd)).set('Slabs', _.compact(mSearch.Slabs)).set('Zzjikch', _.compact(mSearch.Zzjikch)).set('Zzjikgb', _.compact(mSearch.Zzjikgb)).commit();

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
        const oViewModel = this.getViewModel();
        const mSearch = oViewModel.getProperty('/search');

        if (mSearch.Prcty === 'A') {
          if (_.isEmpty(mSearch.Freetx)) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35006') }); // 검색어를 입력하여 주십시오.
        } else {
          if (_.chain(mSearch).omit(['Prcty', 'Werks']).omitBy(_.isEmpty).isEmpty().value()) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_35007') }); // 검색조건을 입력하여 주십시오.
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
          this.validSearchConditions();

          oViewModel.setProperty('/result/busy', true);

          await this.readTalentSearch();
        } catch (oError) {
          this.debug('Controller > Talent > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          setTimeout(() => oViewModel.setProperty('/result/busy', false), 200);
          setTimeout(() => this.byId('talentList').removeSelections(), 300);
        }
      },

      onToggleExpand(oEvent) {
        const bState = oEvent.getParameter('state');

        if (bState) {
          this.showComplexSearch();
        } else {
          this.showSimpleSearch();
        }
      },

      showSimpleSearch() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/search/Prcty', 'A');
        this.byId('searchFilterBody').removeStyleClass('expanded');
        this.resetComplexSearch();

        this.clearSearchResults();
      },

      showComplexSearch() {
        this.getViewModel().setProperty('/search/Prcty', 'B');
        this.byId('searchFilterBody').addStyleClass('expanded');
        this.resetSimpleSearch();

        this.clearSearchResults();
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

      onPressPic(oEvent) {
        const mRowData = oEvent.getSource().getParent().getParent().getParent().getBindingContext().getObject();

        this.openEmployeePop(mRowData.Pernr);
      },

      onPressDialogPic(oEvent) {
        const mRowData = oEvent.getSource().getParent().getParent().getBindingContext().getObject();

        this.openEmployeePop(mRowData.Pernr);
      },

      openEmployeePop(sPernr) {
        if (!sPernr) return;

        const sHost = window.location.href.split('#')[0];
        const sUsrty = this.isMss() ? 'M' : this.isHass() ? 'H' : '';

        window.open(`${sHost}#/employeeView/${sPernr}/${sUsrty}`, '_blank', 'width=1400,height=800');
      },

      resetSimpleSearch() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/search/Freetx', '');
        oViewModel.setProperty('/search/Command', 'AND');
      },

      resetComplexSearch() {
        const oViewModel = this.getViewModel();
        const mSearch = oViewModel.getProperty('/search');

        oViewModel.setProperty('/saved/selectedCondition', 'ALL');
        oViewModel.setProperty('/saved/Schtl', '');
        oViewModel.setProperty(
          '/search',
          _.chain(mSearch)
            .set('Jobgr', [])
            .set('Zzjikgb', [])
            .set('Zzjikch', [])
            .set('EeageFr', '')
            .set('EeageTo', '')
            .set('Schcd', [])
            .set('Major', [])
            .set('Slabs', [])
            .set('Cttyp', [])
            .set('Quali1', '')
            .set('Langlv1', '')
            .set('Quali2', '')
            .set('Langlv2', '')
            .set('Quali3', '')
            .set('Langlv3', '')
            .set('Gesch', '')
            .set('Stell1', '')
            .set('SyearFr1', '')
            .set('SyearTo1', '')
            .set('Stell2', '')
            .set('SyearFr2', '')
            .set('SyearTo2', '')
            .set('Stell3', '')
            .set('SyearFr3', '')
            .set('SyearTo3', '')
            .set('Stell4', '')
            .set('SyearFr4', '')
            .set('SyearTo4', '')
            .value()
        );
      },
    });
  }
);
