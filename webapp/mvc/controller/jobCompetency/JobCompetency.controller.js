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
            Level: 'level5',
            Count: 0,
            BehaviIndicat: [
              {
                Point: true,
                Content: true,
                Header: { type: '', Level: '', LevelTxt: '' },
                Content: { type: '', Step: '' },
                Point: { type: '', Note: '' },
              },
            ],
            RelateJobs: {
              JobTypes: [{ JobName: '' }, { Objid: '' }],
            },
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
            // 직무기술서
          } else {
            // 역량정의서
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
        // 역량정의서
        const aDetailItems = await Client.deep(oModel, 'CompAppStatDefin', mPayLoad);

        // 상시관리 Text
        oViewModel.setProperty('/Competency/Defin', aDetailItems.Defin);

        // 행동지표 수준 GridSetting
        const aFormatBegavioral = this.behavioralIndicators(aDetailItems.CompAppStatScaleSet['results']);

        oViewModel.setProperty('/Competency/BehaviIndicat', aFormatBegavioral);

        // 관련 직무 Btn
        const aRelateJobBtn = this.relateJobBtn(aDetailItems.CompAppStatJobSet['results']);

        oViewModel.setProperty('/Competency/RelateJobs', aRelateJobBtn);
      },

      // 관련직무 Btn
      relateJobBtn(aList = []) {
        const aLoadList = [];
        _.chain(aLoadList)
          .set(
            'JobTypes',
            _.reduce(aList, (acc, cur) => [...acc, { JobName: cur.Stext, Objid: cur.Objid }], [])
          )
          .value();

        return aLoadList;
      },

      // 관련직무 선택
      onPressJob(oEvent) {
        const mSelectedBtn = this.getViewModel().getProperty(oEvent.getSource().getBindingContext().getPath());
      },

      // 행동지표 수준정의 ItemsSettings
      behavioralIndicators(aList = []) {
        const aLoadList = [];
        _.chain(aLoadList)
          .set('Level', `level${aList.length}`)
          .set('Count', aList.length)
          .set(
            'Headers',
            _.reduce(aList, (acc, cur) => [...acc, { type: 'body', Level: cur.Pstext.substring(0, 7), LevelTxt: _.replace(cur.Pstext, cur.Pstext.substring(0, 8), '') }], [{ type: 'head', LevelTxt: this.getBundleText('LABEL_22006') }])
          )
          .set('Contents', [
            ..._.reduce(aList, (acc, cur) => [...acc, { type: 'body', Note: [{ text: cur.Steptext }] }], [{ type: 'head', Note: [{ text: this.getBundleText('LABEL_22007') }] }]), //
            ..._.chain(aList)
              .reduce(
                (acc, cur) => [
                  ...acc,
                  {
                    type: 'body',
                    Note: _.chain(cur)
                      .pickBy((v, p) => _.startsWith(p, 'Note') && !_.isEmpty(v))
                      .map((v) => ({ text: v }))
                      .value(),
                  },
                ],
                [{ type: 'head', Note: [{ text: this.getBundleText('LABEL_22008') }] }]
              )
              .map((o) => ({ ...o, type: _.isEmpty(o.Note) ? 'blank' : o.type }))
              .value(),
          ])
          .commit();

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
        _.each(_.omit(mGroupedByParents, '00000000'), (Noteren, parentId) => _.set(mCatsById, [parentId, 'Noteren'], Noteren));

        return mGroupedByParents['00000000'];
      },
    });
  }
);
