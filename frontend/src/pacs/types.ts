export interface IPatient {
    id: string;
    patient_id: string;
    patient_name: string | null;
    patient_sex: string | null;
    patient_birth_date: string | null;
}

export interface IStudy {
    id: string;
    study_instance_uid: string;
    study_date: string | null;
    study_time: string | null;
    accession_number: string | null;
    study_description: string | null;
    patient_id: string;
    patient?: IPatient; // Eager loaded patient
}

export interface ISeries {
    id: string;
    series_instance_uid: string;
    modality: string;
    series_number: number | null;
    series_description: string | null;
    study_id: string;
}

export interface IInstance {
    id: string;
    sop_instance_uid: string;
    sop_class_uid: string;
    instance_number: number | null;
    file_path: string;
    series_id: string;
}
