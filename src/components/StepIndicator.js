import { CheckIcon } from "./Icons";
import styles from "@/app/page.module.css";

export default function StepIndicator({ steps, currentStepIndex }) {
  return (
    <div className={styles.stepIndicator}>
      {steps.map((step, index) => {
        const isComplete = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;

        return (
          <div key={step.id} className={styles.stepItem}>
            <div
              className={`${styles.step} ${isCurrent ? styles.stepCurrent : ""} ${
                isComplete ? styles.stepComplete : ""
              }`}
            >
              <div className={styles.stepCircle}>
                {isComplete ? <CheckIcon size={12} /> : index + 1}
              </div>
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`${styles.stepConnector} ${
                  isComplete ? styles.stepConnectorComplete : ""
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
