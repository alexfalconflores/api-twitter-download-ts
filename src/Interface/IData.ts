interface IResponse {
    success: boolean;
    message: string;
    data?: IData | {};
}

interface IData {
    url?: string;
    username: string,
    status_type: string,
    thumbnail?: string,
    videos?: Array<IVideo>,
    images?: Array<string>,
    gif?: Array<string>,
}

interface IVideo {
    size: string,
    url: string
}

export { IResponse, IData, IVideo };