/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils,
    FragmentEvent,
    TextUtils,
    TableUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.jobCompetency.JobCompetency', {
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          menid: this.getCurrentMenuId(),
          Hass: this.isHass(),
          selectedKey: 'A',
          Competency: {
            Defin: '',
            CompTree: [],
            BehaviIndicat: [
              {
                Head: {
                  Level: '',
                  LevelTxt: '',
                },
                Step: '',
                Note01: '',
                Note02: '',
                Note03: '',
                Note04: '',
                Note05: '',
                Note06: '',
                Note07: '',
                Note08: '',
                Note09: '',
                Note10: '',
              },
            ],
          },
          busy: false,
        });

        oViewModel.setSizeLimit(500);
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const sWerks = this.getAppointeeProperty('Werks');

          // 근태유형 색상
          // const aList1 = await Client.getEntitySet(oModel, 'TimeTypeLegend', { Werks: this.getAppointeeProperty('Werks') });
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // TabBar 선택
      async onSelectTabBar() {
        const oViewModel = this.getViewModel();
        const sTabKey = oViewModel.getProperty('/selectedKey');

        try {
          oViewModel.setProperty('/busy', true);

          if (sTabKey === 'A') {
          } else {
            const oModel = this.getModel(ServiceNames.APPRAISAL);
            const mPayLoad = {
              Mode: '1',
              Datum: new Date(),
            };
            const aTreeList = await Client.getEntitySet(oModel, 'CompAppTree', mPayLoad);
            const aFormatTree = this.oDataChangeTree(aTreeList);

            oViewModel.setProperty('/Competency/CompTree', aFormatTree);
          }
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // Tree선택
      async onTreePress(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getParameter('listItem').getBindingContext().getPath();
        const oSelectedItem = oViewModel.getProperty(sPath);
        const oModel = this.getModel(ServiceNames.APPRAISAL);

        if (oSelectedItem.Otype === 'QK') {
          return;
        }

        const mPayLoad = {
          Objid: oSelectedItem.Objid,
          CompAppStatJobSet: [],
          CompAppStatScaleSet: [],
        };
        const aDetailItems = await Client.deep(oModel, 'CompAppStatDefin', mPayLoad);

        oViewModel.setProperty('/Competency/Defin', aDetailItems.Defin);

        const aFormatBegavioral = this.behavioralIndicators(aDetailItems.CompAppStatScaleSet['results']);

        oViewModel.setProperty('/Competency/BehaviIndicat', aFormatBegavioral);
        debugger;
      },

      // 행동지표 수준정의 ItemsSettings
      behavioralIndicators(aList = []) {
        const aLoadList = [];

        aList.forEach((e) => {
          const iTitleIdx = e.Pstext.indexOf('(');
          const bTitle = iTitleIdx === -1;

          aLoadList.push({
            Head: {
              Level: bTitle ? e.Pstext : e.Pstext.substr(0, iTitleIdx),
              LevelTxt: bTitle ? '' : e.Pstext.slice(iTitleIdx),
            },
            Step: e.Steptext,
            Note01: e.Note01,
            Note02: e.Note02,
            Note03: e.Note03,
            Note04: e.Note04,
            Note05: e.Note05,
            Note06: e.Note06,
            Note07: e.Note07,
            Note08: e.Note08,
            Note09: e.Note09,
            Note10: e.Note10,
          });
        });

        return aLoadList;
      },

      // oData Tree구조로 만듦
      oDataChangeTree(aList = []) {
        const aConvertedList = _.chain(aList)
          .cloneDeep()
          .map((o) => _.omit(o, '__metadata'))
          .value();
        const mGroupedByParents = _.groupBy(aConvertedList, 'Upobjid');
        const mCatsById = _.keyBy(aConvertedList, 'Objid');
        const oTree = this.byId('CompTree');

        oTree.collapseAll();
        oTree.expandToLevel(1);
        _.each(_.omit(mGroupedByParents, '00000000'), (children, parentId) => _.set(mCatsById, [parentId, 'children'], children));

        return mGroupedByParents['00000000'];
      },
    });
  }
);
