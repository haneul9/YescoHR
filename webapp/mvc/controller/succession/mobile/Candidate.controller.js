sap.ui.define(
  [
    //
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/control/MessageBox',
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
    MessageBox,
    AppUtils,
    UI5Error,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.succession.mobile.Candidate', {
      CODE_KEYS1: 'ABEGJKMNO'.split(''),
      CODE_KEYS2: 'CDFHIL'.split(''), // 조회시 Werks 필요
      COMPANY_ICON: {
        1000: AppUtils.getImageURL('icon_YH.svg'),
        2000: AppUtils.getImageURL('icon_YS.svg'),
        3000: AppUtils.getImageURL('icon_HS.svg'),
        4000: AppUtils.getImageURL('icon_YI.svg'),
        5000: AppUtils.getImageURL('icon_YH.svg'),
      },

      initializeModel() {
        return {
          busy: true,
          searchBar: {
            busy: false,
            showSearchConditions: true,
            Werks: '',
            Plans: '',
          },
          searchConditions: this.getInitSearchConditions(),
          visibleColumn: this.getInitVisibleColumn(),
          candidate: this.getInitListInfo(),
          searchResult: this.getInitListInfo(),
          entries: {
            Werks: [], // 인사영역
            Plans: [], // 대상 포지션
            A: [], // 직무 1~4
            B: [], // 직책
            C: [], // 성과평가등급(3개년평균)
            D: [], // 역량진단등급(3개년평균)
            E: [], // 다면진단등급
            F: [], // 외국어1~3
            G: [], // 외국어수준
            H: [], // 전공
            I: [], // 자격증
            J: [], // 직군
            K: [], // 직급
            L: [], // 학교
            M: [], // 학력
            N: [], // 나이
            O: [], // 성별
            P: [], // 기간
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

      getInitSearchConditions(sWerks) {
        return {
          // 필수 요건
          Stell1: [],
          SyearFr1: '',
          SyearTo1: '',
          Stell2: [],
          SyearFr2: '',
          SyearTo2: '',
          Stell3: [],
          SyearFr3: '',
          SyearTo3: '',
          Stell4: [],
          SyearFr4: '',
          SyearTo4: '',
          Zzjikch: [],
          JikchFr: '',
          JikchTo: '',
          PformGrad: [],
          QualiLv: [],
          DignoGrad: [],
          DignoRank: '',
          // 우대/선호 요건
          Quali1: '',
          Langlv1: '',
          Quali2: '',
          Langlv2: '',
          Quali3: '',
          Langlv3: '',
          Major: [],
          Cttyp: [],
          // 기타 조건
          Werks: sWerks ? [sWerks] : [],
          Jobgr: [],
          Zzjikgb: [],
          PrZzjikch: [],
          Schcd: [],
          Slabs: [],
          EeageFr: '',
          EeageTo: '',
          Gesch: '',
        };
      },

      getInitListInfo() {
        return {
          listInfo: {
            busy: false,
            expand: true,
            rowCount: 0,
            totalCount: 0,
            list: [],
          },
        };
      },

      getInitVisibleColumn() {
        return {
          Ess1: false,
          Ess2: false,
          Ess3: false,
          Ess4: false,
          Ess5: false,
          Esstot: false,
          Ess1Span: 0,
          Ess2Span: 0,
          Ess3Span: 0,
          Ess4Span: 0,
          Ess5Span: 0,
          Pre1: false,
          Pre2: false,
          Pre3: false,
          Pretot: false,
          Pre1Span: 0,
          Pre2Span: 0,
          Pre3Span: 0,
          Etc1: false,
          Etc2: false,
          Etc3: false,
          Etc4: false,
          Etc5: false,
          Etc6: false,
          Etc7: false,
          Etctot: false,
          Etc1Span: 0,
          Etc2Span: 0,
          Etc3Span: 0,
          Etc4Span: 0,
          Etc5Span: 0,
          Etc6Span: 0,
          Etc7Span: 0,
        };
      },

      async onObjectMatched() {
        this.setFieldLengthData();

        const oViewModel = this.getViewModel();

        try {
          oViewModel.setSizeLimit(2000);
          oViewModel.setData(this.initializeModel());

          // const oCandidateTable = this.byId('candidateTable');
          // const oSearchResultTable = this.byId('searchResultTable');
          // this.TableUtils.adjustRowSpan({ oTable: oCandidateTable, aColIndices: [0, 1, 2], sTheadOrTbody: 'thead' });
          // this.TableUtils.adjustRowSpan({ oTable: oSearchResultTable, aColIndices: [0, 1, 2], sTheadOrTbody: 'thead' });
          // this.TableUtils.adjustHeaderColSpan(oCandidateTable);
          // this.TableUtils.adjustHeaderColSpan(oSearchResultTable);
          // this.setTableCellStyle(oCandidateTable);
          // this.setTableCellStyle(oSearchResultTable);

          const Werks = this.getAppointeeProperty('Werks');
          const oCommonModel = this.getModel(ServiceNames.COMMON);
          const oTalentModel = this.getModel(ServiceNames.TALENT);
          const aEntries = await Promise.all([
            Client.getEntitySet(oCommonModel, 'PersAreaList'),
            Client.getEntitySet(oTalentModel, 'SuccessionPlansList', { Werks }), //
            ..._.map(this.CODE_KEYS1, (Mode) => Client.getEntitySet(oTalentModel, 'SuccessionCodeList', { Mode })),
            ..._.map(this.CODE_KEYS2, (Mode) => Client.getEntitySet(oTalentModel, 'SuccessionCodeList', { Werks, Mode })),
          ]);

          const aNoValueEntries = ['F', 'G', 'N', 'O'];
          const aNumberCodeEntries = ['N'];
          const sYear = this.getBundleText('LABEL_00252'); // 년
          const aYears = _.concat(
            [{ Zcode: '', Ztext: '' }],
            _.times(25, (i) => ({ Zcode: i + 1, Ztext: `${i + 1}${sYear}` }))
          );
          const aWerks = _.map(aEntries.shift(), (m) => _.omit(m, '__metadata'));
          const aPlans = this.convertSearchConditionEntry({ aEntries: aEntries.shift() });

          oViewModel.setProperty('/searchBar/Werks', Werks);
          oViewModel.setProperty('/entries/Werks', aWerks);
          oViewModel.setProperty('/entries/Plans', aPlans);
          oViewModel.setProperty('/entries/P', aYears);

          _.forEach(_.concat(this.CODE_KEYS1, this.CODE_KEYS2), (sCodeKey, iIndex) => {
            const bContainReset = _.includes(aNoValueEntries, sCodeKey);
            const bNumberCode = _.includes(aNumberCodeEntries, sCodeKey);
            oViewModel.setProperty(`/entries/${sCodeKey}`, this.convertSearchConditionEntry({ aEntries: aEntries[iIndex], bContainReset, bNumberCode }));
          });
        } catch (oError) {
          this.debug('Controller > Mobile Candidate > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      convertSearchConditionEntry({ aEntries, bContainReset = false, bNumberCode = false }) {
        return _.chain(aEntries)
          .map((o) => ({ ..._.omit(o, '__metadata'), Zcode: bNumberCode ? _.toNumber(o.Zcode) : _.trim(o.Zcode) }))
          .thru((arr) => (bContainReset ? [{ Zcode: '', Ztext: '' }, ...arr] : arr))
          .value();
      },

      setTableCellStyle(oTable) {
        oTable.addEventDelegate(
          {
            onAfterRendering() {
              const $Table = this.$();
              $Table.find('.sapMLabel.header-mandatory').parents('.sapUiTableHeaderCell').toggleClass('header-mandatory', true);
              $Table.find('.sapMLabel.header-preference').parents('.sapUiTableHeaderCell').toggleClass('header-preference', true);
              $Table.find('.sapMLabel.header-etc').parents('.sapUiTableHeaderCell').toggleClass('header-etc', true);
              $Table.find('.sapMLabel.header-total').parents('.sapUiTableHeaderCell').toggleClass('header-total', true);
              $Table.find('.sapMLabel.header-subtotal').parents('.sapUiTableHeaderCell').toggleClass('header-subtotal', true);
              $Table.find('.sapMText.cell-total').parents('.sapUiTableDataCell').toggleClass('cell-total', true);
              $Table.find('.sapMText.cell-subtotal').parents('.sapUiTableDataCell').toggleClass('cell-subtotal', true);
            },
          },
          oTable
        );
      },

      async onChangeWerks() {
        this.setBusy();

        try {
          const oViewModel = this.getViewModel();
          const Werks = oViewModel.getProperty('/searchBar/Werks');

          const oTalentModel = this.getModel(ServiceNames.TALENT);
          const aEntries = await Promise.all([
            Client.getEntitySet(oTalentModel, 'SuccessionPlansList', { Werks }), //
            ..._.map(this.CODE_KEYS2, (Mode) => Client.getEntitySet(oTalentModel, 'SuccessionCodeList', { Werks, Mode })),
          ]);

          const aNoValueEntries = ['F', 'G', 'N', 'O'];
          const aNumberCodeEntries = ['N'];
          const aPlans = this.convertSearchConditionEntry({ aEntries: aEntries.shift() });

          oViewModel.setProperty('/entries/Plans', aPlans);
          _.forEach(this.CODE_KEYS2, (sCodeKey, iIndex) => {
            const bContainReset = _.includes(aNoValueEntries, sCodeKey);
            const bNumberCode = _.includes(aNumberCodeEntries, sCodeKey);
            oViewModel.setProperty(`/entries/${sCodeKey}`, this.convertSearchConditionEntry({ aEntries: aEntries[iIndex], bContainReset, bNumberCode }));
          });

          this.resetAll();
        } catch (oError) {
          this.debug('Controller > Candidate > onChangeWerks Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      async onChangePlans() {
        try {
          const oViewModel = this.getViewModel();
          const sPlans = oViewModel.getProperty('/searchBar/Plans');
          if (_.isEmpty(sPlans)) {
            return;
          }

          this.setBusy();

          const [mSavedSearchConditions] = await Client.getEntitySet(this.getModel(ServiceNames.TALENT), 'SuccessionSearchCondition', {
            Plans: sPlans,
          });

          oViewModel.setProperty('/searchConditions', {
            ..._.chain(mSavedSearchConditions) //
              .omit('__metadata')
              .set('Werks', _.isEmpty(mSavedSearchConditions.Werks) ? [oViewModel.getProperty('/searchBar/Werks')] : _.split(mSavedSearchConditions.Werks, '|'))
              .set('Stell1', _.isEmpty(mSavedSearchConditions.Stell1) ? [] : _.split(mSavedSearchConditions.Stell1, '|'))
              .set('Stell2', _.isEmpty(mSavedSearchConditions.Stell2) ? [] : _.split(mSavedSearchConditions.Stell2, '|'))
              .set('Stell3', _.isEmpty(mSavedSearchConditions.Stell3) ? [] : _.split(mSavedSearchConditions.Stell3, '|'))
              .set('Stell4', _.isEmpty(mSavedSearchConditions.Stell4) ? [] : _.split(mSavedSearchConditions.Stell4, '|'))
              .set('Zzjikch', _.isEmpty(mSavedSearchConditions.Zzjikch) ? [] : _.split(mSavedSearchConditions.Zzjikch, '|'))
              .set('PformGrad', _.isEmpty(mSavedSearchConditions.PformGrad) ? [] : _.split(mSavedSearchConditions.PformGrad, '|'))
              .set('QualiLv', _.isEmpty(mSavedSearchConditions.QualiLv) ? [] : _.split(mSavedSearchConditions.QualiLv, '|'))
              .set('DignoGrad', _.isEmpty(mSavedSearchConditions.DignoGrad) ? [] : _.split(mSavedSearchConditions.DignoGrad, '|'))
              .set('Major', _.isEmpty(mSavedSearchConditions.Major) ? [] : _.split(mSavedSearchConditions.Major, '|'))
              .set('Cttyp', _.isEmpty(mSavedSearchConditions.Cttyp) ? [] : _.split(mSavedSearchConditions.Cttyp, '|'))
              .set('Jobgr', _.isEmpty(mSavedSearchConditions.Jobgr) ? [] : _.split(mSavedSearchConditions.Jobgr, '|'))
              .set('Zzjikgb', _.isEmpty(mSavedSearchConditions.Zzjikgb) ? [] : _.split(mSavedSearchConditions.Zzjikgb, '|'))
              .set('PrZzjikch', _.isEmpty(mSavedSearchConditions.PrZzjikch) ? [] : _.split(mSavedSearchConditions.PrZzjikch, '|'))
              .set('Schcd', _.isEmpty(mSavedSearchConditions.Schcd) ? [] : _.split(mSavedSearchConditions.Schcd, '|'))
              .set('Slabs', _.isEmpty(mSavedSearchConditions.Slabs) ? [] : _.split(mSavedSearchConditions.Slabs, '|'))
              .value(),
          });
          oViewModel.setProperty('/candidate', this.getInitListInfo());
          oViewModel.setProperty('/searchResult', this.getInitListInfo());
          oViewModel.setProperty('/visibleColumn', this.getInitVisibleColumn());
          oViewModel.setProperty('/searchBar/showSearchConditions', true);
        } catch (oError) {
          this.debug('Controller > Candidate > onChangePlans Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      async onPressDetailConditionsDialog() {
        if (!this.oDetailConditionsDialog) {
          const oView = this.getView();

          this.oDetailConditionsDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.succession.mobile.fragment.DetailConditionsDialog',
            controller: this,
          });

          this.oDetailConditionsDialog.attachAfterOpen(() => {
            setTimeout(() => {
              $('.sapMTokenizer').each(function () {
                $(this).scrollLeft(0);
              });
            }, 200);
          });

          oView.addDependent(this.oDetailConditionsDialog);
        }

        this.oDetailConditionsDialog.open();
      },

      onPressDetailClose() {
        this.oDetailConditionsDialog.close();
      },

      async onPressSearch() {
        this.setBusy();
        this.setTableBusy();

        try {
          this.validateSearchConditions();

          await this.readCandidateSearch();
        } catch (oError) {
          this.debug('Controller > Candidate > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
          this.setTableBusy(false);
        }
      },

      validateSearchConditions() {
        const oViewModel = this.getViewModel();

        const sPlans = oViewModel.getProperty('/searchBar/Plans');
        if (!sPlans) {
          this.throwError('MSG_45002'); // 대상 포지션을 선택하세요.
        }

        const mSearchConditions = oViewModel.getProperty('/searchConditions');

        if (_.chain(mSearchConditions).pick(['Stell1', 'Stell2', 'Stell3', 'Stell4', 'Zzjikch', 'PformGrad', 'QualiLv', 'DignoGrad', 'DignoRank']).omitBy(_.isEmpty).isEmpty().value()) {
          this.throwError('MSG_45003'); // 최소 1개의 필수요건을 입력하세요.
        }
        if (!_.isEmpty(mSearchConditions.Stell1) && (_.isEmpty(mSearchConditions.SyearFr1) || _.isEmpty(mSearchConditions.SyearTo1))) {
          this.throwError('MSG_35004', '1'); // 직무기간 {1}의 시작/종료값을 모두 입력하세요.
        }
        if (_.toNumber(mSearchConditions.SyearFr1) > _.toNumber(mSearchConditions.SyearTo1)) {
          this.throwError('MSG_35005', '1'); // 직무기간 {1} 입력값의 최소값이 최대값보다 큽니다.
        }
        if (!_.isEmpty(mSearchConditions.Stell2) && (_.isEmpty(mSearchConditions.SyearFr2) || _.isEmpty(mSearchConditions.SyearTo2))) {
          this.throwError('MSG_35004', '2'); // 직무기간 {2}의 시작/종료값을 모두 입력하세요.
        }
        if (_.toNumber(mSearchConditions.SyearFr2) > _.toNumber(mSearchConditions.SyearTo2)) {
          this.throwError('MSG_35005', '2'); // 직무기간 {2} 입력값의 최소값이 최대값보다 큽니다.
        }
        if (!_.isEmpty(mSearchConditions.Stell3) && (_.isEmpty(mSearchConditions.SyearFr3) || _.isEmpty(mSearchConditions.SyearTo3))) {
          this.throwError('MSG_35004', '3'); // 직무기간 {3}의 시작/종료값을 모두 입력하세요.
        }
        if (_.toNumber(mSearchConditions.SyearFr3) > _.toNumber(mSearchConditions.SyearTo3)) {
          this.throwError('MSG_35005', '3'); // 직무기간 {3} 입력값의 최소값이 최대값보다 큽니다.
        }
        if (!_.isEmpty(mSearchConditions.Stell4) && (_.isEmpty(mSearchConditions.SyearFr4) || _.isEmpty(mSearchConditions.SyearTo4))) {
          this.throwError('MSG_35004', '4'); // 직무기간 {4}의 시작/종료값을 모두 입력하세요.
        }
        if (_.toNumber(mSearchConditions.SyearFr4) > _.toNumber(mSearchConditions.SyearTo4)) {
          this.throwError('MSG_35005', '4'); // 직무기간 {4} 입력값의 최소값이 최대값보다 큽니다.
        }
        if (!_.isEmpty(mSearchConditions.Zzjikch) && (_.isEmpty(mSearchConditions.JikchFr) || _.isEmpty(mSearchConditions.JikchTo))) {
          this.throwError('MSG_45004'); // 직책기간의 시작/종료값을 모두 입력하세요.
        }
        if (_.toNumber(mSearchConditions.JikchFr) > _.toNumber(mSearchConditions.JikchTo)) {
          this.throwError('MSG_45005'); // 직책기간 입력값의 최소값이 최대값보다 큽니다.
        }
        const bEmptyDignoGrad = _.isEmpty(mSearchConditions.DignoGrad);
        const bEmptyDignoRank = _.isEmpty(mSearchConditions.DignoRank);
        if (!bEmptyDignoRank) {
          if (bEmptyDignoGrad) {
            this.throwError('MSG_45012'); // 다면진단 등급을 선택하세요.
          }
          if (isNaN(mSearchConditions.DignoRank) || _.toNumber(mSearchConditions.DignoRank) < 0 || _.toNumber(mSearchConditions.DignoRank) > 100) {
            this.throwError('MSG_45006'); // 다면진단 순위를 0부터 100까지의 숫자로 입력하세요.\n(소수점 이하 한자리까지 입력가능)
          }
          if (!/^\d{2,3}(\.\d)?$/.test(mSearchConditions.DignoRank)) {
            this.throwError('MSG_45006'); // 다면진단 순위를 0부터 100까지의 숫자로 입력하세요.\n(소수점 이하 한자리까지 입력가능)
          }
        }
        if (!bEmptyDignoGrad && bEmptyDignoRank) {
          this.throwError('MSG_45006'); // 다면진단 순위를 0부터 100까지의 숫자로 입력하세요.\n(소수점 이하 한자리까지 입력가능)
        }
        if (!_.isEmpty(mSearchConditions.Quali1) && _.isEmpty(mSearchConditions.Langlv1)) {
          this.throwError('MSG_35003', 'LABEL_35009', '1'); // {외국어} {1}의 수준을 선택하세요.
        }
        if (!_.isEmpty(mSearchConditions.Quali2) && _.isEmpty(mSearchConditions.Langlv2)) {
          this.throwError('MSG_35003', 'LABEL_35009', '2'); // {외국어} {2}의 수준을 선택하세요.
        }
        if (!_.isEmpty(mSearchConditions.Quali3) && _.isEmpty(mSearchConditions.Langlv3)) {
          this.throwError('MSG_35003', 'LABEL_35009', '3'); // {외국어} {3}의 수준을 선택하세요.
        }
        if (_.toNumber(mSearchConditions.EeageFr) > _.toNumber(mSearchConditions.EeageTo)) {
          this.throwError('MSG_35002'); // 나이 입력값의 최소값이 최대값보다 큽니다.
        }
      },

      throwError(...aMessageCodes) {
        throw new UI5Error({ code: 'I', message: this.getBundleText(...aMessageCodes) });
      },

      async readCandidateSearch() {
        const oViewModel = this.getViewModel();
        const mSearchConditions = oViewModel.getProperty('/searchConditions');
        const mSC = _.chain(_.cloneDeep(mSearchConditions)).omitBy(_.isEmpty).set('Plans', oViewModel.getProperty('/searchBar/Plans')).value();

        const aResults = await Client.getEntitySet(this.getModel(ServiceNames.TALENT), 'SuccessionSearch', mSC);
        const aCandidates = this.getFiltered(aResults, (m) => m.Cpchk === 'X');
        const aSearchResults = this.getFiltered(aResults, (m) => m.Cpchk !== 'X');

        oViewModel.setProperty('/visibleColumn', this.getVisibleColumn(mSearchConditions));
        oViewModel.setProperty('/candidate/listInfo/list', aCandidates); // 승계후보자
        oViewModel.setProperty('/candidate/listInfo/rowCount', Math.min(3, aCandidates.length));
        oViewModel.setProperty('/candidate/listInfo/totalCount', aCandidates.length);
        oViewModel.setProperty('/searchResult/listInfo/list', aSearchResults); // 검색결과
        oViewModel.setProperty('/searchResult/listInfo/rowCount', Math.min(6, aSearchResults.length));
        oViewModel.setProperty('/searchResult/listInfo/totalCount', aSearchResults.length);

        if (!aResults.length) {
          MessageBox.information(this.getBundleText('MSG_00062')); // 검색결과가 없습니다.

          this.getViewModel().setProperty('/searchBar/showSearchConditions', true);
        } else {
          this.getViewModel().setProperty('/searchBar/showSearchConditions', false);

          // TODO 검색결과 table height 계산해서 rowCount 조절
        }
      },

      getFiltered(aResults, fnPredicate) {
        const sUnknownAvatarImageURL = this.getUnknownAvatarImageURL();
        return _.chain(aResults)
          .filter(fnPredicate)
          .map((m) => ({ ..._.omit(m, '__metadata'), ColtyState: m.Colty, PicUrl: _.trim(m.PicUrl) || sUnknownAvatarImageURL, Chckd: '', Icon: this.COMPANY_ICON[m.Werks] }))
          .value();
      },

      getVisibleColumn(m) {
        const [Ess1, Ess2, Ess3, Ess4, Ess5, Pre1, Pre2, Pre3, Etc1, Etc2, Etc3, Etc4, Etc5, Etc6, Etc7] = [
          m.Stell1.length + m.Stell2.length + m.Stell3.length + m.Stell4.length > 0,
          !!m.Zzjikch.length,
          !!m.PformGrad.length,
          !!m.QualiLv.length,
          !!m.DignoGrad.length,
          m.Quali1.length + m.Quali2.length + m.Quali3.length > 0,
          !!m.Major.length,
          !!m.Cttyp.length,
          !!m.Jobgr.length,
          !!m.Zzjikgb.length,
          !!m.PrZzjikch.length,
          !!m.Schcd.length,
          !!m.Slabs.length,
          !!m.EeageFr.length,
          !!m.Gesch.length,
        ];
        const [Esstot, Pretot, Etctot] = [
          Ess1 || Ess2 || Ess3 || Ess4 || Ess5, //
          Pre1 || Pre2 || Pre3,
          Etc1 || Etc2 || Etc3 || Etc4 || Etc5 || Etc6 || Etc7,
        ];
        return {
          Ess1,
          Ess2,
          Ess3,
          Ess4,
          Ess5,
          Esstot,
          Pre1,
          Pre2,
          Pre3,
          Pretot,
          Etc1,
          Etc2,
          Etc3,
          Etc4,
          Etc5,
          Etc6,
          Etc7,
          Etctot,
        };
      },

      onPressResetAll() {
        MessageBox.confirm(this.getBundleText('MSG_45007'), {
          // 검색조건 및 검색결과를 초기화 하시겠습니까?
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) {
              return;
            }

            this.resetAll();
          },
        });
      },

      resetAll() {
        const oViewModel = this.getViewModel();
        const mSearchConditions = oViewModel.getProperty('/searchConditions');

        // oViewModel.setProperty('/searchBar/Plans', '');
        oViewModel.setProperty('/searchConditions', this.getInitSearchConditions(mSearchConditions.Werks));
        oViewModel.setProperty('/candidate', this.getInitListInfo());
        oViewModel.setProperty('/searchResult', this.getInitListInfo());
        oViewModel.setProperty('/visibleColumn', this.getInitVisibleColumn());
      },

      async onPressLegend(oEvent) {
        const oControl = oEvent.getSource();

        if (!this.oLegendPopover) {
          const oView = this.getView();

          this.oLegendPopover = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.succession.mobile.fragment.LegendPopover',
            controller: this,
          });

          oView.addDependent(this.oLegendPopover);
        }

        this.oLegendPopover.openBy(oControl);
      },

      onSelectCheckBox(oEvent) {
        const oCheckBox = oEvent.getSource();
        const mRowData = oCheckBox.getParent().getParent().getParent().getBindingContext().getObject();

        mRowData.Chckd = oCheckBox.getSelected() ? 'X' : '';
        this.getViewModel().refresh();
      },

      async onPressCompare() {
        this.setBusy();

        try {
          const oViewModel = this.getViewModel();
          const aCandidates = _.chain(oViewModel.getProperty('/candidate/listInfo/list'))
            .filter((m) => m.Chckd === 'X')
            .map((m) => m.Pernr)
            .value();
          const aSearchResults = _.chain(oViewModel.getProperty('/searchResult/listInfo/list'))
            .filter((m) => m.Chckd === 'X')
            .map((m) => m.Pernr)
            .value();
          const aPernr = _.chain(aCandidates).concat(aSearchResults).uniq().value();

          if (aPernr.length < 2) {
            this.throwError('MSG_45010'); // 프로파일을 비교할 대상자를 선택하세요.
          }

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
          this.debug('Controller > Candidate > onPressCompare Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
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
        if (!this.oCompareDialog) {
          const oView = this.getView();

          this.oCompareDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.succession.fragment.CompareDialog',
            controller: this,
          });

          oView.addDependent(this.oCompareDialog);

          this.oCompareDialog.attachAfterOpen(() => {
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

        this.oCompareDialog.open();
      },

      onPressCompareDialogClose() {
        this.oCompareDialog.close();
      },

      onSelectionChangeStell(oEvent) {
        const oControl = oEvent.getSource();
        if (!oControl.getSelectedKeys().length) {
          const sSeq = oControl.data('seq');
          const oViewModel = this.getViewModel();
          oViewModel.setProperty(`/searchConditions/SyearFr${sSeq}`, '');
          oViewModel.setProperty(`/searchConditions/SyearTo${sSeq}`, '');
        }
      },

      onSelectionChangeZzjikch(oEvent) {
        if (!oEvent.getSource().getSelectedKeys().length) {
          const oViewModel = this.getViewModel();
          oViewModel.setProperty(`/searchConditions/JikchFr`, '');
          oViewModel.setProperty(`/searchConditions/JikchTo`, '');
        }
      },

      onChangePeriod(oEvent) {
        const oControl = oEvent.getSource();
        const oViewModel = this.getViewModel();
        const sTargetProp = oControl.data('target');
        const sValue = oControl.getSelectedKey();
        const iValue = Number(sValue || 0);
        const iTargetValue = Number(oViewModel.getProperty(`/searchConditions/${sTargetProp}`) || 0);

        if (_.isEmpty(sValue)) {
          oViewModel.setProperty(`/searchConditions/${sTargetProp}`, '');
        } else if (iTargetValue === 0 || iValue > iTargetValue) {
          oViewModel.setProperty(`/searchConditions/${sTargetProp}`, sValue);
        }

        oControl.getParent().getItems()[2].getBinding('items').filter(new Filter('Zcode', FilterOperator.GE, iValue));
      },

      onChangeQuali(oEvent) {
        const sSeq = oEvent.getSource().data('seq');

        this.getViewModel().setProperty(`/searchConditions/Langlv${sSeq}`, '');
      },

      onPressSaveSearchConditions() {
        MessageBox.confirm(this.getBundleText('MSG_45008'), {
          // 현재 포지션의 기본 검색조건으로 저장하시겠습니까?
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) {
              return;
            }

            this.saveSearchConditions();
          },
        });
      },

      async saveSearchConditions() {
        this.setBusy();

        try {
          this.validateSearchConditions();

          await this.createSearchConditions();

          MessageBox.success(this.getBundleText('MSG_00007', 'LABEL_00103')); // {저장}되었습니다.
        } catch (oError) {
          this.debug('Controller > Candidate > saveSearchConditions Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      async createSearchConditions() {
        const oViewModel = this.getViewModel();
        const mSearchConditions = _.cloneDeep(oViewModel.getProperty('/searchConditions'));

        _.forEach(mSearchConditions, (vValue, sFieldName) => {
          const mField = this.MULTI_VALUE_FIELDS[sFieldName];
          if (mField) {
            const sJoin = vValue.join('|');
            if (sJoin.length > mField.maxLength) {
              const iMaxItemCount = Math.floor(mField.maxLength / (vValue[0].length + 1));
              this.throwError('MSG_45009', mField.label, iMaxItemCount); // {0}의 최대 선택 가능 개수는 {1}개입니다.
            }
            mSearchConditions[sFieldName] = sJoin;
          }
        });

        mSearchConditions.Plans = oViewModel.getProperty('/searchBar/Plans');

        await Client.create(this.getModel(ServiceNames.TALENT), 'SuccessionSearchCondition', mSearchConditions);
      },

      onPressPhoto(oEvent) {
        const mRowData = oEvent.getSource().getParent().getParent().getParent().getBindingContext().getObject();

        this.openEmployeePop(mRowData.Pernr);
      },

      onPressDialogPhoto(oEvent) {
        const mRowData = oEvent.getSource().getParent().getParent().getBindingContext().getObject();

        this.openEmployeePop(mRowData.Pernr);
      },

      openEmployeePop(sPernr) {
        if (!sPernr) {
          return;
        }

        const sHost = window.location.href.split('#')[0];
        const sUsrty = this.isMss() ? 'M' : this.isHass() ? 'H' : '';

        window.open(`${sHost}#/employeeView/${sPernr}/${sUsrty}`, '_blank', 'width=1400,height=800');
      },

      setBusy(bBusy = true) {
        setTimeout(() => this.getViewModel().setProperty('/busy', bBusy), bBusy ? 0 : 200);
      },

      setTableBusy(bBusy = true) {
        setTimeout(() => this.getViewModel().setProperty('/candidate/listInfo/busy', bBusy), bBusy ? 0 : 200);
        setTimeout(() => this.getViewModel().setProperty('/searchResult/listInfo/busy', bBusy), bBusy ? 0 : 200);
      },

      setFieldLengthData() {
        setTimeout(() => {
          const mMetadata = this.getModel('metadataModel').getProperty(`/${ServiceNames.TALENT}/SuccessionSearchCondition`);
          this.MULTI_VALUE_FIELDS = _.chain(mMetadata)
            .pick(['Stell1', 'Stell2', 'Stell3', 'Stell4', 'Zzjikch', 'PformGrad', 'QualiLv', 'DignoGrad', 'Major', 'Cttyp', 'Werks', 'Jobgr', 'Zzjikgb', 'PrZzjikch', 'Schcd', 'Slabs'])
            .map(({ label, maxLength }, sFieldName) => ({ [sFieldName]: { label, maxLength } }))
            .reduce((acc, cur) => ({ ...acc, ...cur }), {})
            .value();
        });
      },
    });
  }
);
