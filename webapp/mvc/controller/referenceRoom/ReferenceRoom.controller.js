sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    //
    Fragment,
    MessageBox,
    AttachFileAction,
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.referenceRoom.ReferenceRoom', {
      AttachFileAction: AttachFileAction,
      initializeModel() {
        return {
          busy: false,
          Hass: this.isHass(),
          FormData: {},
          ManagerList: [],
          TreeFullList: [],
          ReferenceList: [],
          AccType: [],
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());

        try {
          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.COMMON, 'HelpInfoTab2')));

          oViewModel.setProperty('/FormData', {
            Title: '의료비',
            Menu: '예스코 > 복리후생 > 의료비',
            Change: '인재개발팀 이수만 차장',
            ChangeDate: '2022.02.22. 17:34',
            Head: '의료비 신청',
            Mid: '본사: 정재훈 과장 (인재개발팀) \n경인지사: 이재훈 대리 (노경지원팀)',
            Bot: '',
            A: '1',
            B: '2',
            C: '3',
          });

          const aTree = await this.getReferenceRoom();
          const tree = [];
          const aTree2 = _.chain(aTree.HelpInfo1Nav.results)
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
          const aTree3 = _.keyBy(aTree2, 'id');
          const aTree4 = _.groupBy(aTree2, (e) => {
            return !!e.L4id ? 'L3id' : !!e.L3id ? 'L2id' : !!e.L2id ? 'L1id' : '';
          });
          debugger;
          // $.each(aTree.HelpInfo1Nav.results, function (i, o) {
          //   delete o.__metadata;

          //   if (o.L4id) {
          //     const mapId = [o.L1id, o.L2id, o.L3id].join();
          //     if (treeMap[mapId]) {
          //       treeMap[mapId].push($.extend(o, { title: o.L4txt }));
          //     } else {
          //       treeMap[mapId] = [$.extend(o, { title: o.L4txt })];
          //     }
          //   } else if (o.L3id) {
          //     // eslint-disable-next-line no-redeclare
          //     const mapId = [o.L1id, o.L2id, ''].join();
          //     if (treeMap[mapId]) {
          //       treeMap[mapId].push($.extend(o, { title: o.L3txt }));
          //     } else {
          //       treeMap[mapId] = [$.extend(o, { title: o.L3txt })];
          //     }

          //     mapId = [o.L1id, o.L2id, o.L3id].join();
          //     if (!treeMap[mapId]) {
          //       o.nodes = treeMap[mapId] = [];
          //     }
          //   } else if (o.L2id) {
          //     // eslint-disable-next-line no-redeclare
          //     const mapId = [o.L1id, '', ''].join();
          //     if (treeMap[mapId]) {
          //       treeMap[mapId].push($.extend(o, { title: o.L2txt }));
          //     } else {
          //       treeMap[mapId] = [$.extend(o, { title: o.L2txt })];
          //     }

          //     mapId = [o.L1id, o.L2id, ''].join();
          //     if (!treeMap[mapId]) {
          //       o.nodes = treeMap[mapId] = [];
          //     }
          //   } else {
          //     // eslint-disable-next-line no-redeclare
          //     const mapId = [o.L1id, '', ''].join();
          //     o.title = o.L1txt;
          //     o.nodes = treeMap[mapId] = [];
          //     tree.push(o);
          //   }
          // });

          oViewModel.setProperty('/TreeFullList', tree);
          oViewModel.setProperty('/ReferenceList', tree);

          this.oDataChangeTree();
          this.settingsAttachTable();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
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

      // PDF출력파일 첨부
      onFileChange(oEvent) {
        const oEventSource = oEvent.getSource();
        const oFileUploader = oEventSource;
        const aFileList = [];
        const files = oEvent.getParameter('files');
      },

      // oData Tree Setting
      oDataChangeTree() {
        const oTree = this.byId('ReferenceTree');

        oTree.collapseAll();
        oTree.expandToLevel(1);
      },

      // override AttachFileCode
      getApprovalType() {
        return 'INFO';
      },

      // 관리자조회 Dialog 닫기클릭
      onClick(oEvent) {
        oEvent.getSource().getParent().close();
      },

      // 관리자조회
      onManagerBtn() {
        const oView = this.getView();

        setTimeout(() => {
          if (!this._pManagerDialog) {
            this._pManagerDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.referenceRoom.fragment.Manager',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          this._pManagerDialog.then(async function (oDialog) {
            oDialog.open();
          });
        }, 100);
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const sStatus = oViewModel.getProperty('/FormData/ZappStatAl');
        const sAppno = oViewModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus,
          Type: this.getApprovalType(),
          Appno: sAppno,
          Message: this.getBundleText('MSG_29003'),
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'txt', 'png'],
        });
      },
    });
  }
);
