sap.ui.define(
  [
    //
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/AppUtils',
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
    AppUtils,
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
          search: {
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
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setSizeLimit(2000);
          oViewModel.setData(this.initializeModel());
          oViewModel.setProperty('/busy', true);

          const sPernr = this.getAppointeeProperty('Pernr');
          const fCurried = Client.getEntitySet(this.getModel(ServiceNames.PA));
          const [aEntryA, aEntryB, aEntryC, aEntryD, aEntryE, aEntryF, aEntryG, aEntryH, aEntryI, aEntryJ, aEntryK, aEntryL, aEntryM] = await Promise.all([
            fCurried('TalentSearchCodeList', { Pernr: sPernr, Schfld: 'A' }), //
            fCurried('TalentSearchCodeList', { Pernr: sPernr, Schfld: 'B' }),
            fCurried('TalentSearchCodeList', { Pernr: sPernr, Schfld: 'C' }),
            fCurried('TalentSearchCodeList', { Pernr: sPernr, Schfld: 'D' }),
            fCurried('TalentSearchCodeList', { Pernr: sPernr, Schfld: 'E' }),
            fCurried('TalentSearchCodeList', { Pernr: sPernr, Schfld: 'F' }),
            fCurried('TalentSearchCodeList', { Pernr: sPernr, Schfld: 'G' }),
            fCurried('TalentSearchCodeList', { Pernr: sPernr, Schfld: 'H' }),
            fCurried('TalentSearchCodeList', { Pernr: sPernr, Schfld: 'I' }),
            fCurried('TalentSearchCodeList', { Pernr: sPernr, Schfld: 'J' }),
            fCurried('TalentSearchCodeList', { Pernr: sPernr, Schfld: 'K' }),
            fCurried('TalentSearchCodeList', { Pernr: sPernr, Schfld: 'L' }),
            fCurried('TalentSearchCodeList', { Pernr: sPernr, Schfld: 'M' }),
          ]);

          oViewModel.setProperty('/entry', {
            A: _.map(aEntryA, (o) => ({ ..._.omit(o, '__metadata'), Zcode: _.trim(o.Zcode) })),
            B: _.map(aEntryB, (o) => ({ ..._.omit(o, '__metadata'), Zcode: _.trim(o.Zcode) })),
            C: _.map(aEntryC, (o) => ({ ..._.omit(o, '__metadata'), Zcode: _.trim(o.Zcode) })),
            D: _.concat(
              { Zcode: '', Ztext: '' },
              _.map(aEntryD, (o) => ({ ..._.omit(o, '__metadata'), Zcode: _.toNumber(o.Zcode) }))
            ),
            E: _.map(aEntryE, (o) => ({ ..._.omit(o, '__metadata'), Zcode: _.trim(o.Zcode) })),
            F: _.map(aEntryF, (o) => ({ ..._.omit(o, '__metadata'), Zcode: _.trim(o.Zcode) })),
            G: _.map(aEntryG, (o) => ({ ..._.omit(o, '__metadata'), Zcode: _.trim(o.Zcode) })),
            H: _.map(aEntryH, (o) => ({ ..._.omit(o, '__metadata'), Zcode: _.trim(o.Zcode) })),
            I: _.concat(
              { Zcode: '', Ztext: '' },
              _.map(aEntryI, (o) => ({ ..._.omit(o, '__metadata'), Zcode: _.trim(o.Zcode) }))
            ),
            J: _.concat(
              { Zcode: '', Ztext: '' },
              _.map(aEntryJ, (o) => ({ ..._.omit(o, '__metadata'), Zcode: _.trim(o.Zcode) }))
            ),
            K: _.concat(
              { Zcode: '', Ztext: '' },
              _.map(aEntryK, (o) => ({ ..._.omit(o, '__metadata'), Zcode: _.trim(o.Zcode) }))
            ),
            L: _.concat(
              { Zcode: '', Ztext: '' },
              _.map(aEntryL, (o) => ({ ..._.omit(o, '__metadata'), Zcode: _.trim(o.Zcode) }))
            ),
            M: _.concat(
              { Zcode: '', Ztext: '' },
              _.map(aEntryM, (o) => ({ ..._.omit(o, '__metadata'), Zcode: _.toNumber(o.Zcode) }))
            ),
          });
        } catch (oError) {
          this.debug('Controller > Talent > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.byId('searchFilterBody').removeStyleClass('expanded');
          oViewModel.setProperty('/busy', false);
        }
      },

      onDialog() {
        if (!this.byId('talentCompareDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.talent.fragment.CompareDialog',
            controller: this,
          }).then((oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            oDialog.open();
          });
        } else {
          this.byId('talentCompareDialog').open();
        }
      },

      onCompareDialogM() {
        if (!this.byId('talentCompareDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.talent.fragment.CompareDialogM',
            controller: this,
          }).then((oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            oDialog.open();
          });
        } else {
          this.byId('talentCompareDialog').open();
        }
      },

      onSearchDialog() {
        if (!this.byId('talentSearchDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.talent.fragment.SearchDialog',
            controller: this,
          }).then((oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            oDialog.open();
          });
        } else {
          this.byId('talentCompareDialog').open();
        }
      },

      onClick() {
        this.byId('talentCompareDialog').close();
        this.byId('talentSearchDialog').close();
      },

      onModeChange(oEvent) {
        var sMode = oEvent.getParameter('item').getKey();

        this.byId('talentList').setMode(sMode);
        this.byId('talentList').setHeaderText('GridList with mode ' + sMode);
      },

      onSelectionChange(oEvent) {
        var oGridListItem = oEvent.getParameter('listItem'),
          bSelected = oEvent.getParameter('selected');

        MessageToast.show((bSelected ? 'Selected' : 'Unselected') + ' item with Id ' + oGridListItem.getId());
      },

      onDelete(oEvent) {
        var oGridListItem = oEvent.getParameter('listItem');

        MessageToast.show('Delete item with Id ' + oGridListItem.getId());
      },

      onDetailPress(oEvent) {
        var oGridListItem = oEvent.getSource();

        MessageToast.show('Request details for item with Id ' + oGridListItem.getId());
      },

      onPress(oEvent) {
        var oGridListItem = oEvent.getSource();

        MessageToast.show('Pressed item with Id ' + oGridListItem.getId());
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

        oControl.getParent().getItems()[2].getBinding('items').filter(new Filter('Zcode', FilterOperator.GE, oControl.getSelectedKey()));
      },

      async readTalentSearch() {
        const oViewModel = this.getViewModel();

        try {
          const mSearch = oViewModel.getProperty('/search');
          const mFilters = mSearch.Prcty === 'A' ? _.pick(mSearch, ['Freetx', 'Prcty']) : _.omit(mSearch, 'Freetx');
          const aSearchResults = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'TalentSearch', { Pernr: this.getAppointeeProperty('Pernr'), ..._.omitBy(mFilters, _.isEmpty) });
          const mState = { 1: 'Indication01', 2: 'Indication02', 3: 'Indication03' };

          oViewModel.setProperty('/result/totalCount', aSearchResults.length);
          oViewModel.setProperty(
            '/result/list',
            _.map(aSearchResults, (o) => ({ ..._.omit(o, '__metadata'), ColtyState: mState[o.Colty] }))
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

        oViewModel.setProperty('/result/busy', true);

        try {
          this.validSearchConditions();

          await this.readTalentSearch();
        } catch (oError) {
          this.debug('Controller > Talent > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          setTimeout(() => oViewModel.setProperty('/result/busy', false), 200);
        }
      },

      onToggleExpand(oEvent) {
        const oViewModel = this.getViewModel();
        const oSearchFilterBody = this.byId('searchFilterBody');
        const bState = oEvent.getParameter('state');

        oSearchFilterBody.toggleStyleClass('expanded');

        if (bState) {
          oViewModel.setProperty('/search/Prcty', 'B');
          this.resetSimpleSearch();
        } else {
          oViewModel.setProperty('/search/Prcty', 'A');
          this.resetComplexSearch();
        }
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
        this.getViewModel().setProperty('/result', {
          busy: false,
          totalCount: 0,
          list: [],
        });
      },

      resetSimpleSearch() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/search/Freetx', '');
      },

      resetComplexSearch() {
        const oViewModel = this.getViewModel();
        const mSearch = oViewModel.getProperty('/search');

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
