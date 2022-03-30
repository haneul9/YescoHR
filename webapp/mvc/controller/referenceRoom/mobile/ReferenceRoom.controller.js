sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    //
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.referenceRoom.mobile.ReferenceRoom', {
      initializeModel() {
        return {
          busy: false,
          TreeFullList: [],
          ReferenceList: [],
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          if (_.isEmpty(oViewModel.getProperty('/TreeFullList'))) {
            const aTree = await this.getReferenceRoom();
            const aVariat = this.oDataChangeTree(aTree.HelpInfo1Nav.results);

            oViewModel.setProperty('/TreeFullList', aTree.HelpInfo1Nav.results);
            oViewModel.setProperty('/ReferenceList', aVariat);
          }
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // oData Tree Setting
      oDataChangeTree(aList = []) {
        const oTree = this.byId('ReferenceTree');
        let tree1 = [];
        let tree2 = [];
        let tree3 = [];
        let tree4 = [];

        oTree.collapseAll();
        oTree.expandToLevel(1);
        const aTree2 = _.chain(aList)
          .map((o) => _.omit(o, '__metadata'))
          .map((e) => {
            if (e.L4id) {
              return { ...e, id: e.L4id, title: e.L4tx, use: e.L4use };
            } else if (e.L3id) {
              return { ...e, id: e.L3id, title: e.L3tx, use: e.L3use };
            } else if (e.L2id) {
              return { ...e, id: e.L2id, title: e.L2tx, use: e.L2use };
            } else if (e.L1id) {
              return { ...e, id: e.L1id, title: e.L1tx, use: e.L1use };
            }
          })
          .value();
        _.forEach(aTree2, (e) => {
          if (e.L4id) {
            tree4.push(e);
          }
          if (e.L3id && !e.L4id) {
            tree3.push(e);
          }
          if (e.L2id && !e.L3id) {
            tree2.push(e);
          }
          if (e.L1id && !e.L2id) {
            tree1.push(e);
          }
        });

        _.forEach(tree1, (e) => {
          e.child = _.filter(tree2, (e1) => {
            return e.L1id === e1.L1id;
          });
        });
        _.forEach(tree2, (e) => {
          if (e.L2id) {
            e.child = _.filter(tree3, (e1) => {
              return e.L2id === e1.L2id;
            });
          }
        });
        _.forEach(tree3, (e) => {
          if (e.L3id) {
            e.child = _.filter(tree4, (e1) => {
              return e.L3id === e1.L3id;
            });
          }
        });

        return tree1;
      },

      // tree정보 다받아옴
      async getReferenceRoom() {
        const oModel = this.getModel(ServiceNames.COMMON);
        const mAppointee = this.getAppointeeData();
        const mPayLoad = {
          Pernr: mAppointee.Pernr,
          Werks: mAppointee.Werks,
          Menid: this.getCurrentMenuId(),
          Prcty: 'T',
          HelpInfo1Nav: [],
          HelpInfo2Nav: [],
          HelpInfo3Nav: [],
          HelpInfo4Nav: [],
        };

        return await Client.deep(oModel, 'HelpInfo', mPayLoad);
      },

      // Tree선택시 상세내용조회
      async treeDetail(sL1id = '', sL2id = '', sL3id = '', sL4id = '', sWerks = '') {
        const oModel = this.getModel(ServiceNames.COMMON);
        const mAppointee = this.getAppointeeData();
        const mPayLoad = {
          Pernr: mAppointee.Pernr,
          Werks: mAppointee.Werks,
          Menid: this.getCurrentMenuId(),
          Prcty: 'D',
          HelpInfo1Nav: [
            {
              Werks: sWerks,
              L1id: sL1id,
              L2id: sL2id,
              L3id: sL3id,
              L4id: sL4id,
            },
          ],
          HelpInfo2Nav: [],
          HelpInfo4Nav: [],
        };

        return await Client.deep(oModel, 'HelpInfo', mPayLoad);
      },

      // TreeSelect
      async onSelectTree(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getSource().getSelectedContexts()[0].getPath();
        const mSelectedTree = oViewModel.getProperty(sPath);
        const mRoutKey = {
          L1id: mSelectedTree.L1id,
          L2id: mSelectedTree.L2id,
          L3id: mSelectedTree.L3id,
          L4id: mSelectedTree.L4id,
        };

        const oDetail = await this.treeDetail(mSelectedTree.L1id, mSelectedTree.L2id, mSelectedTree.L3id, mSelectedTree.L4id, this.getAppointeeProperty('Werks'));
        const aFormData = oDetail.HelpInfo2Nav.results || [];
        const [mPdfUrl] = oDetail.HelpInfo4Nav.results;

        if (_.isEmpty(aFormData) && (!mPdfUrl || !mPdfUrl.Fileuri)) {
          return;
        }

        this.getRouter().navTo('mobile/referenceRoom-detail', mRoutKey);
      },
    });
  }
);
