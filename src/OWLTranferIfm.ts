export class OWLFormerTeam {
  team: string;
  formerPosition: string;
  constructor() {
    this.team = '';
    this.formerPosition = '';
  }
}

export class OWLTransferPerson {
  name: string | undefined;
  id: string | undefined;
  position: string | undefined;
  nationality: string[] | undefined;
  formerTeam: OWLFormerTeam | undefined;
}

export class OWLTransfer {
  team: string;
  archive: OWLTransferPerson[];

  constructor(str: string) {
    this.team = str;
    this.archive = [];
  }

}

export class OWLTransferIfm extends Object{
  //updated: Date;
  data: OWLTransfer[];

  constructor() {
    super();
    //this.updated = new Date();
    this.data = [];
  }

  // update() {
  //   this.updated = new Date();
  //   this.updated.setHours(this.updated.getHours() + 9);
  // }

  pushTeam(str: string) {
    this.data.push(new OWLTransfer(str));
  }

  pushPerson(person: OWLTransferPerson) {
    this.data[this.data.length - 1].archive.push(person);
  }

  // toJSON() {
  //   return {
  //     'updated': this.updated.toDateString,
  //     'data': this.data.toString,
  //   };
  // }
}
