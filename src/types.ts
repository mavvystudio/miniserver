export type CustomServer = { preInit: any };

export type ServiceItem = {
  name: string;
  url: string;
  methods: string[];
};

export type Handler = {
  name: string;
  handler: Function;
};
