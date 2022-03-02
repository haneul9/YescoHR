sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    //
    Fragment,
    MessageBox,
    AttachFileAction,
    AppUtils,
    ComboEntry,
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
          AccType: [
            { Zcode: '1', Ztext: 'ESS>의료비신청(4410)' },
            { Zcode: '2', Ztext: 'HASS>의료비신청(8430)' },
            { Zcode: '3', Ztext: 'ESS>의료비신청(4410)' },
          ],
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());

        try {
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
          this.settingsAttachTable();
          // const oSessionData = this.getSessionData();
          // const aComList = await this.areaList();
          // oViewModel.setProperty('/CompanyCode', aComList);
          // const aPartList = await this.partList();
          // oViewModel.setProperty('/PartCode', aPartList);
          // this.setYears();
          // oViewModel.setProperty('/search', {
          //   Werks: oSessionData.Werks,
          //   Orgeh: _.get(aPartList, [0, 'Orgeh']),
          //   Orgtx: _.get(aPartList, [0, 'Orgtx']),
          //   Zyear: String(new Date().getFullYear()),
          // });
          // this.onSearch();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // PDF출력파일 첨부
      onFileChange(oEvent) {
        const oEventSource = oEvent.getSource();
        const oFileUploader = oEventSource;
        const aFileList = [];
        const files = oEvent.getParameter('files');
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR02';
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
