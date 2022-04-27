/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    TableUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.jobCompetency.App', {
      TableUtils: TableUtils,

      initializeModel() {
        return {
          menid: this.getCurrentMenuId(),
          Hass: this.isHass(),
          isView: true,
          selectedKey: 'A',
          Define: {
            busy: true,
            isLoaded: false,
            tree: [],
            descriptionM: { list1: [] },
            description1: { list: [], rowCount: 1 },
            description2: { list: [], rowCount: 1 },
            description3: { list: [], rowCount: 1 },
            description4: { list: [], rowCount: 1 },
            description5: { list: [], rowCount: 1 },
            description6: { list: [], rowCount: 1 },
          },
          Competency: {
            busy: true,
            isLoaded: false,
            Title: '',
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
        };
      },

      async onObjectMatched(mRouteArguments, sRouteName) {
        const oViewModel = this.getViewModel();

        oViewModel.setSizeLimit(500);
        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        try {
          if (_.isEmpty(mRouteArguments)) {
            await this.loadDefine();
            await this.loadCompetency();

            oViewModel.setProperty('/selectedKey', sRouteName === 'jobDefine' ? 'A' : 'B');
          } else {
            sap.ui.getCore().byId('container-ehr---app--appMenuToolbar').setVisible(false);
            oViewModel.setProperty('/isView', false);

            if (sRouteName === 'jobDefine-view') {
              oViewModel.setProperty('/Define/isLoaded', true);

              await this.callDefineData(mRouteArguments.objid);
            } else {
              oViewModel.setProperty('/Competency/isLoaded', true);
              oViewModel.setProperty('/Competency/Title', mRouteArguments.title);

              await this.callCompetencyData(mRouteArguments.objid);
            }

            setTimeout(() => $('#container-ehr---app--app').addClass('popup-body'), 200);
          }
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);

          TableUtils.adjustRowSpan({
            oTable: this.byId('defineContent2Table'),
            aColIndices: [0, 1, 2, 3, 4, 5, 6],
            sTheadOrTbody: 'thead',
          });
          TableUtils.adjustRowSpan({
            oTable: this.byId('defineContent2Table'),
            aColIndices: [0, 1, 2],
            sTheadOrTbody: 'tbody',
          });
        }
      },

      async loadCompetency() {
        const oViewModel = this.getViewModel();
        const aTreeList = await Client.getEntitySet(this.getModel(ServiceNames.APPRAISAL), 'CompAppTree', { Mode: '1', Datum: moment().hours(9).toDate() });
        const aFormatTree = this.oDataChangeTree(aTreeList, 'CompTree');

        oViewModel.setProperty('/Competency', {
          busy: false,
          isLoaded: true,
          Title: aTreeList[0].Stext,
          Defin: '',
          CompTree: aFormatTree,
          Level: '',
          Count: 0,
          BehaviIndicat: [],
        });
      },

      async loadDefine() {
        const oViewModel = this.getViewModel();

        try {
          const aTreeData = await Client.getEntitySet(this.getModel(ServiceNames.APPRAISAL), 'DescriptionTree', {
            Mode: '1',
            Datum: moment().hours(9).toDate(),
          });

          oViewModel.setProperty('/Define/tree', this.oDataChangeTree(aTreeData, 'DefineTree'));

          await this.callDefineData(this.getAppointeeProperty('Stell'));
        } catch (oError) {
          this.debug('Controller > jobCompetency App > loadDefine Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/Define/isLoaded', true);
        }
      },

      // TabBar 선택
      async onSelectTabBar() {
        const oViewModel = this.getViewModel();
        const sTabKey = oViewModel.getProperty('/selectedKey');

        try {
          oViewModel.setProperty('/busy', true);

          if (sTabKey === 'A') {
            oViewModel.setProperty('/Define/busy', false);
            if (oViewModel.getProperty('/Define/isLoaded')) return;

            await this.loadDefine();
          } else {
            oViewModel.setProperty('/Competency/busy', false);
            if (oViewModel.getProperty('/Competency/isLoaded')) return;

            await this.loadCompetency();
          }
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async onTreeDefinePress(oEvent) {
        const oSelectedTreeItem = oEvent.getParameter('listItem').getBindingContext().getObject();

        if (oSelectedTreeItem.Otype !== 'C') return;

        await this.callDefineData(oSelectedTreeItem.Objid);
      },

      async callDefineData(sObjid) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/Define/busy', true);

        try {
          const mDeepDefineResult = await Client.deep(this.getModel(ServiceNames.APPRAISAL), 'JobDescriptionMain', {
            Stell: sObjid,
            Datum: moment().hours(9).toDate(),
            JobDescription1Set: [],
            JobDescription2Set: [],
            JobDescription3Set: [],
            JobDescription4Set: [],
            JobDescription5Set: [],
            JobDescription6Set: [],
          });

          oViewModel.setProperty('/Define/descriptionM', _.pick(mDeepDefineResult, ['Jobgrtx', 'Jobfmtx', 'Stelltx', 'Zzorgtx', 'Zzowner', 'Zzfnedt', 'Zzdefin', 'Zzslabs', 'Zzndprf1', 'Zzmajor1', 'Zzndprf2', 'Zzmajor2']));
          oViewModel.setProperty('/Define/description1', {
            rowCount: mDeepDefineResult.JobDescription1Set.results.length,
            list: _.map(mDeepDefineResult.JobDescription1Set.results, (o) =>
              _.chain(o)
                .omit('__metadata')
                .set('Zzweihtb', `${_.toNumber(o.Zzweihtb)}`)
                .set('Zzweiht', _.trim(o.Zzweiht))
                .value()
            ),
          });
          oViewModel.setProperty('/Define/description2', {
            rowCount: mDeepDefineResult.JobDescription2Set.results.length,
            list: _.map(mDeepDefineResult.JobDescription2Set.results, (o) => _.omit(o, '__metadata')),
          });
          oViewModel.setProperty('/Define/description3', {
            rowCount: mDeepDefineResult.JobDescription3Set.results.length,
            list: _.map(mDeepDefineResult.JobDescription3Set.results, (o) => _.omit(o, '__metadata')),
          });
          oViewModel.setProperty('/Define/description4', {
            rowCount: mDeepDefineResult.JobDescription4Set.results.length,
            list: _.map(mDeepDefineResult.JobDescription4Set.results, (o) => _.omit(o, '__metadata')),
          });
          oViewModel.setProperty('/Define/description5', {
            rowCount: Math.max(mDeepDefineResult.JobDescription5Set.results.length, mDeepDefineResult.JobDescription6Set.results.length),
            list: _.map(mDeepDefineResult.JobDescription5Set.results, (o) => _.omit(o, '__metadata')),
          });
          oViewModel.setProperty('/Define/description6', {
            rowCount: Math.max(mDeepDefineResult.JobDescription5Set.results.length, mDeepDefineResult.JobDescription6Set.results.length),
            list: _.map(mDeepDefineResult.JobDescription6Set.results, (o) => _.omit(o, '__metadata')),
          });
        } catch (oError) {
          this.debug('Controller > jobCompetency App > callDefineData Error', oError);

          AppUtils.handleError(oError);
        } finally {
          setTimeout(() => oViewModel.setProperty('/Define/busy', false), 200);
        }
      },

      // Tree선택
      async onTreePress(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getParameter('listItem').getBindingContext().getPath();
        const oSelectedItem = oViewModel.getProperty(sPath);

        oViewModel.setProperty('/Competency/Title', oSelectedItem.Stext);

        if (oSelectedItem.Otype === 'QK') {
          return;
        }

        await this.callCompetencyData(oSelectedItem.Objid);
      },

      async callCompetencyData(sObjid) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/Competency/busy', true);

        try {
          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const mPayLoad = {
            Objid: sObjid,
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
        } catch (oError) {
          this.debug('Controller > jobCompetency App > callCompetencyData Error', oError);

          AppUtils.handleError(oError);
        } finally {
          setTimeout(() => oViewModel.setProperty('/Competency/busy', false), 200);
        }
      },

      onPress2TableRow(oEvent) {
        const oViewModel = this.getViewModel();
        const oRowData = oEvent.getSource().getParent().getBindingContext().getObject();

        if (_.isEmpty(oRowData.Zzobjid)) return;

        if (oViewModel.getProperty('/isView')) {
          oViewModel.setProperty('/selectedKey', 'B');
          oViewModel.setProperty('/Competency/Title', oRowData.Zzqulnm);

          this.callCompetencyData(oRowData.Zzobjid);
        } else {
          const sHost = window.location.href.split('#')[0];

          window.open(`${sHost}#/jobCompetency/${oRowData.Zzobjid}/${oRowData.Zzqulnm}`, '_blank', 'width=1300,height=800');
        }
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
        const oViewModel = this.getViewModel();
        const mSelectedData = oEvent.getSource().getBindingContext().getObject();

        if (_.isEmpty(mSelectedData.Objid)) return;

        if (oViewModel.getProperty('/isView')) {
          oViewModel.setProperty('/selectedKey', 'A');
          this.callDefineData(mSelectedData.Objid);
        } else {
          const sHost = window.location.href.split('#')[0];

          window.open(`${sHost}#/jobDefine/${mSelectedData.Objid}`, '_blank', 'width=1300,height=800');
        }
      },

      // 행동지표 수준정의 ItemsSettings
      behavioralIndicators(aList = []) {
        const aLoadList = [];
        _.chain(aLoadList)
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

        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/Competency/Level', `level${aList.length}`);
        oViewModel.setProperty('/Competency/Count', aList.length);

        return aLoadList;
      },

      // oData Tree구조로 만듦
      oDataChangeTree(aList = [], sTreeId) {
        const aConvertedList = _.chain(aList)
          .cloneDeep()
          .map((o) => _.omit(o, '__metadata'))
          .value();
        const mGroupedByParents = _.groupBy(aConvertedList, 'Upobjid');
        const mCatsById = _.keyBy(aConvertedList, 'Objid');
        const oTree = this.byId(sTreeId);

        oTree.collapseAll();
        oTree.expandToLevel(1);
        _.each(_.omit(mGroupedByParents, '00000000'), (Noteren, parentId) => _.set(mCatsById, [parentId, 'Noteren'], Noteren));

        return mGroupedByParents['00000000'];
      },
    });
  }
);
