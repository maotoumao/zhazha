class CurrentSchemaData {
  private schema: ISchema | null = null;

  private currentSchemaPath: string | null = null;

  setSchema(_schema: ISchema | null) {
    this.schema = _schema;
  }

  getSchema() {
    return this.schema;
  }

  updateKeyMap(key: string, value: ISchema['keymap'][string]) {
    if (this.schema === null) {
      this.schema = {
        keymap: {},
      };
    }
    if (this.schema?.keymap && key) {
      this.schema.keymap[key] = value;
    }
  }

  newSchema() {
    this.schema = null;
    this.currentSchemaPath = null;
  }

  setSchemaPath(sp: string | null) {
    this.currentSchemaPath = sp;
  }

  getSchemaPath() {
    return this.currentSchemaPath;
  }
}

export default new CurrentSchemaData();
